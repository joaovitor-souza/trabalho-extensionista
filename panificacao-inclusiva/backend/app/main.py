from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app import auth, models, schemas, uploads
from app.config import settings
from app.conteudo_padrao import DEFAULT_CONTEUDO
from app.database import SessionLocal, engine, get_db, garantir_coluna_senha_provisoria

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    enabled=settings.rate_limit_enabled,
)


def seed_config_inicial(db: Session) -> None:
    if db.get(models.Config, 1) is None:
        db.add(
            models.Config(
                id=1,
                nome_loja=settings.nome_loja_padrao,
                whatsapp=settings.whatsapp_padrao,
                senha_hash=auth.hash_senha(settings.admin_senha_padrao),
                senha_provisoria=True,
            )
        )
        db.commit()


def seed_conteudo_inicial(db: Session) -> None:
    for chave, valor in DEFAULT_CONTEUDO.items():
        if db.get(models.ConteudoSite, chave) is None:
            db.add(models.ConteudoSite(chave=chave, valor=valor))
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    garantir_coluna_senha_provisoria()
    db = SessionLocal()
    try:
        seed_config_inicial(db)
        seed_conteudo_inicial(db)
    finally:
        db.close()
    uploads.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="Panificação Inclusiva — API",
    lifespan=lifespan,
    # /docs, /redoc e /openapi.json só existem em dev (DEBUG=true).
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Respostas da API (JSON) saem comprimidas quando passam de 500 bytes —
# economiza banda em 3G/4G e reduz o TTFB percebido.
app.add_middleware(GZipMiddleware, minimum_size=500)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    # PATCH precisa estar aqui: sem ele o preflight do toggle de
    # disponibilidade volta 400 e o navegador bloqueia a requisição.
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

uploads.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads.UPLOAD_DIR), name="uploads")


def get_config(db: Session) -> models.Config:
    config = db.get(models.Config, 1)
    if config is None:
        # Só pode faltar se o lifespan não rodou (não deve acontecer em uso normal).
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Configuração da loja não inicializada")
    return config


def get_produto_ou_404(db: Session, produto_id: int) -> models.Produto:
    produto = db.get(models.Produto, produto_id)
    if produto is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produto não encontrado")
    return produto


# ---------------------------------------------------------------------------
# Rotas públicas (catálogo do cliente)
# ---------------------------------------------------------------------------

@app.get("/api/produtos", response_model=list[schemas.ProdutoOut])
def listar_produtos_publico(db: Session = Depends(get_db)):
    return db.query(models.Produto).filter(models.Produto.disponivel == True).all()  # noqa: E712


# Cache público: dado que quase nunca muda. O navegador serve a cópia local por
# 5 min e revalida em background. NUNCA aplicar em /api/admin/* (é conteúdo por sessão).
_CACHE_PUBLICO = "public, max-age=300, stale-while-revalidate=86400"


@app.get("/api/config", response_model=schemas.ConfigOut)
def obter_config_publica(response: Response, db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = _CACHE_PUBLICO
    return get_config(db)


@app.get("/api/conteudo", response_model=dict[str, str])
def obter_conteudo_publico(response: Response, db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = _CACHE_PUBLICO
    linhas = db.query(models.ConteudoSite).all()
    return {linha.chave: linha.valor for linha in linhas}


# ---------------------------------------------------------------------------
# Autenticação da vendedora/dona
# ---------------------------------------------------------------------------

@app.post("/api/admin/login")
@limiter.limit("5/minute")
def login(request: Request, dados: schemas.LoginIn, response: Response, db: Session = Depends(get_db)):
    config = get_config(db)
    usuario_ok = auth.usuarios_iguais(dados.usuario, settings.admin_usuario_padrao)
    senha_ok = auth.verificar_senha(dados.senha, config.senha_hash)
    if not usuario_ok or not senha_ok:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuário ou senha incorretos")
    token = auth.criar_token_sessao()
    auth.definir_cookie_sessao(response, token)
    return auth.payload_sessao(config.senha_provisoria)


@app.post("/api/admin/logout")
def logout(response: Response):
    auth.limpar_cookie_sessao(response)
    return {"ok": True}


@app.get("/api/admin/me")
def verificar_sessao(db: Session = Depends(get_db), sessao: dict = Depends(auth.exigir_sessao)):
    config = get_config(db)
    return auth.payload_sessao(config.senha_provisoria)


# ---------------------------------------------------------------------------
# Gestão de produtos (painel da dona)
# ---------------------------------------------------------------------------

@app.get("/api/admin/produtos", response_model=list[schemas.ProdutoOut])
def listar_produtos_admin(db: Session = Depends(get_db), sessao: dict = Depends(auth.exigir_sessao)):
    return db.query(models.Produto).all()


@app.post("/api/admin/produtos", response_model=schemas.ProdutoOut, status_code=status.HTTP_201_CREATED)
def criar_produto(
    dados: schemas.ProdutoCreate,
    db: Session = Depends(get_db),
    sessao: dict = Depends(auth.exigir_sessao),
):
    produto = models.Produto(**dados.model_dump(), disponivel=True)
    db.add(produto)
    db.commit()
    db.refresh(produto)
    return produto


@app.put("/api/admin/produtos/{produto_id}", response_model=schemas.ProdutoOut)
def editar_produto(
    produto_id: int,
    dados: schemas.ProdutoUpdate,
    db: Session = Depends(get_db),
    sessao: dict = Depends(auth.exigir_sessao),
):
    produto = get_produto_ou_404(db, produto_id)
    for campo, valor in dados.model_dump().items():
        setattr(produto, campo, valor)
    db.commit()
    db.refresh(produto)
    return produto


@app.patch("/api/admin/produtos/{produto_id}/disponibilidade", response_model=schemas.ProdutoOut)
def alterar_disponibilidade(
    produto_id: int,
    dados: schemas.DisponibilidadeIn,
    db: Session = Depends(get_db),
    sessao: dict = Depends(auth.exigir_sessao),
):
    produto = get_produto_ou_404(db, produto_id)
    produto.disponivel = dados.disponivel
    db.commit()
    db.refresh(produto)
    return produto


@app.delete("/api/admin/produtos/{produto_id}")
def excluir_produto(
    produto_id: int,
    db: Session = Depends(get_db),
    sessao: dict = Depends(auth.exigir_sessao),
):
    produto = get_produto_ou_404(db, produto_id)
    db.delete(produto)
    db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Configuração da loja (nome, WhatsApp, senha)
# ---------------------------------------------------------------------------

@app.put("/api/admin/config", response_model=schemas.ConfigOut)
def atualizar_config(
    dados: schemas.ConfigUpdate,
    db: Session = Depends(get_db),
    sessao: dict = Depends(auth.exigir_sessao),
):
    config = get_config(db)
    config.nome_loja = dados.nome_loja
    config.whatsapp = dados.whatsapp
    if dados.nova_senha:
        config.senha_hash = auth.hash_senha(dados.nova_senha)
        config.senha_provisoria = False
    db.commit()
    db.refresh(config)
    return config


# ---------------------------------------------------------------------------
# Conteúdo editável da página (texto e imagens de hero/essência/espaço/galeria)
# ---------------------------------------------------------------------------

@app.put("/api/admin/conteudo", response_model=dict[str, str])
def atualizar_conteudo(
    dados: schemas.ConteudoUpdate,
    db: Session = Depends(get_db),
    sessao: dict = Depends(auth.exigir_sessao),
):
    chaves_invalidas = set(dados.valores) - set(DEFAULT_CONTEUDO)
    if chaves_invalidas:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Chave(s) desconhecida(s): {', '.join(chaves_invalidas)}")

    for chave, valor in dados.valores.items():
        linha = db.get(models.ConteudoSite, chave)
        linha.valor = valor
    db.commit()

    linhas = db.query(models.ConteudoSite).all()
    return {linha.chave: linha.valor for linha in linhas}


@app.post("/api/admin/upload")
async def enviar_imagem(
    arquivo: UploadFile = File(...),
    sessao: dict = Depends(auth.exigir_sessao),
):
    conteudo = await arquivo.read()
    url = uploads.salvar_imagem(conteudo)
    return {"url": url}
