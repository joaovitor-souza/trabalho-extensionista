import pytest
from fastapi.testclient import TestClient

from app.main import app

PRODUTO_EXEMPLO = {
    "nome": "Pão Teste",
    "categoria": "Pão Salgado",
    "badge": "Clássico",
    "peso": "500g",
    "descricao": "",
    "preco": 10.0,
    "preco_detalhe": "",
    "imagem_url": "",
}

CREDENCIAIS_OK = {"usuario": "admin", "senha": "admin123"}


def login_admin(client: TestClient):
    resposta = client.post("/api/admin/login", json=CREDENCIAIS_OK)
    assert resposta.status_code == 200
    return resposta


def definir_senha_provisoria(valor: bool) -> None:
    from app import models
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        config = db.get(models.Config, 1)
        config.senha_provisoria = valor
        db.commit()
    finally:
        db.close()


@pytest.fixture()
def client():
    # TestClient só dispara o lifespan (que cria as tabelas) como context manager.
    with TestClient(app) as c:
        yield c


def test_rotas_publicas_respondem_sem_expor_hash_de_senha(client):
    assert client.get("/api/produtos").status_code == 200
    resposta = client.get("/api/config")
    assert resposta.status_code == 200
    corpo = resposta.json()
    assert "pin_hash" not in corpo
    assert "senha_hash" not in corpo
    assert "usuario" not in corpo


def test_rotas_admin_exigem_sessao(client):
    assert client.get("/api/admin/produtos").status_code == 401
    assert client.get("/api/admin/me").status_code == 401


def test_login_com_senha_errada_retorna_401(client):
    resposta = client.post("/api/admin/login", json={"usuario": "admin", "senha": "senha-errada"})
    assert resposta.status_code == 401
    assert "session" not in resposta.cookies


def test_login_com_usuario_desconhecido_retorna_401(client):
    # Quebra se qualquer usuário for aceito (o PIN antigo só checava a senha).
    resposta = client.post("/api/admin/login", json={"usuario": "outra-pessoa", "senha": "admin123"})
    assert resposta.status_code == 401
    assert "session" not in resposta.cookies


def test_login_rejeita_campo_pin(client):
    so_pin = client.post("/api/admin/login", json={"pin": "admin123"})
    assert so_pin.status_code == 422

    pin_no_lugar_da_senha = client.post(
        "/api/admin/login", json={"usuario": "admin", "pin": "admin123"}
    )
    assert pin_no_lugar_da_senha.status_code == 422


def test_login_sem_usuario_ou_senha_retorna_422(client):
    assert client.post("/api/admin/login", json={"senha": "admin123"}).status_code == 422
    assert client.post("/api/admin/login", json={"usuario": "admin"}).status_code == 422
    assert client.post("/api/admin/login", json={}).status_code == 422


def test_login_com_usuario_e_senha_corretos_libera_rotas_admin(client):
    login = login_admin(client)
    assert "session" in login.cookies
    assert login.json()["ok"] is True
    assert login.json()["usuario"] == "admin"
    assert isinstance(login.json()["must_change_password"], bool)
    me = client.get("/api/admin/me")
    assert me.status_code == 200
    assert isinstance(me.json()["must_change_password"], bool)


def test_login_nao_distingue_usuario_de_senha_errados(client):
    # Mesma resposta para usuário errado ou senha errada: não vaza se a conta existe.
    senha_errada = client.post("/api/admin/login", json={"usuario": "admin", "senha": "senha-errada"})
    usuario_errado = client.post(
        "/api/admin/login", json={"usuario": "outra-pessoa", "senha": "admin123"}
    )
    assert senha_errada.status_code == 401
    assert usuario_errado.status_code == 401
    assert senha_errada.json() == usuario_errado.json()
    assert "session" not in senha_errada.cookies
    assert "session" not in usuario_errado.cookies


def test_login_com_senha_provisoria_sinaliza_troca_obrigatoria(client):
    definir_senha_provisoria(True)
    login = login_admin(client)
    assert login.json()["must_change_password"] is True
    assert client.get("/api/admin/me").json()["must_change_password"] is True


def test_login_com_senha_definitiva_nao_exige_troca(client):
    definir_senha_provisoria(False)
    login = login_admin(client)
    assert login.json()["must_change_password"] is False
    assert client.get("/api/admin/me").json()["must_change_password"] is False


def test_trocar_senha_remove_obrigatoriedade_de_troca(client):
    definir_senha_provisoria(True)
    login_admin(client)
    troca = client.put(
        "/api/admin/config",
        json={"nome_loja": "Natural Pani", "whatsapp": "5522981535778", "nova_senha": "senhaNova44"},
    )
    assert troca.status_code == 200

    login_novo = client.post(
        "/api/admin/login", json={"usuario": "admin", "senha": "senhaNova44"}
    )
    assert login_novo.status_code == 200
    assert login_novo.json()["must_change_password"] is False
    assert client.get("/api/admin/me").json()["must_change_password"] is False

    client.put(
        "/api/admin/config",
        json={"nome_loja": "Natural Pani", "whatsapp": "5522981535778", "nova_senha": "admin123"},
    )


def test_login_rate_limit_retorna_429_na_sexta_tentativa():
    from app.main import limiter

    limiter.enabled = True
    try:
        with TestClient(app) as client:
            for _ in range(5):
                resposta = client.post(
                    "/api/admin/login",
                    json={"usuario": "admin", "senha": "senha-errada"},
                )
                assert resposta.status_code == 401
            sexta = client.post(
                "/api/admin/login",
                json={"usuario": "admin", "senha": "senha-errada"},
            )
            assert sexta.status_code == 429
    finally:
        limiter.enabled = False


def test_toggle_disponibilidade_remove_do_catalogo_publico(client):
    login_admin(client)
    criado = client.post("/api/admin/produtos", json=PRODUTO_EXEMPLO)
    assert criado.status_code == 201
    produto_id = criado.json()["id"]

    catalogo = client.get("/api/produtos").json()
    assert any(p["id"] == produto_id for p in catalogo)

    oculto = client.patch(
        f"/api/admin/produtos/{produto_id}/disponibilidade", json={"disponivel": False}
    )
    assert oculto.status_code == 200

    catalogo_depois = client.get("/api/produtos").json()
    assert not any(p["id"] == produto_id for p in catalogo_depois)


def test_nome_com_script_e_persistido_como_texto_puro(client):
    login_admin(client)
    payload = {**PRODUTO_EXEMPLO, "nome": "<script>alert(1)</script>"}
    resposta = client.post("/api/admin/produtos", json=payload)
    assert resposta.status_code == 201
    # A API não sanitiza/escapa aqui de propósito: quem escapa na hora de
    # exibir é o React (interpolação em JSX), não o backend.
    assert resposta.json()["nome"] == "<script>alert(1)</script>"


def test_excluir_produto_inexistente_retorna_404(client):
    login_admin(client)
    resposta = client.delete("/api/admin/produtos/999999")
    assert resposta.status_code == 404


def test_trocar_senha_invalida_login_com_senha_antiga(client):
    login_admin(client)
    troca = client.put(
        "/api/admin/config",
        json={"nome_loja": "Natural Pani", "whatsapp": "5522981535778", "nova_senha": "novaSenha99"},
    )
    assert troca.status_code == 200

    login_antigo = client.post("/api/admin/login", json=CREDENCIAIS_OK)
    assert login_antigo.status_code == 401

    login_novo = client.post(
        "/api/admin/login", json={"usuario": "admin", "senha": "novaSenha99"}
    )
    assert login_novo.status_code == 200

    # Devolve a senha padrão para não quebrar os outros testes desta suíte.
    client.put(
        "/api/admin/config",
        json={"nome_loja": "Natural Pani", "whatsapp": "5522981535778", "nova_senha": "admin123"},
    )


def test_conteudo_publico_traz_valores_e_exige_sessao_para_editar(client):
    publico = client.get("/api/conteudo")
    assert publico.status_code == 200
    assert publico.json()["hero_titulo"]  # seed já rodou no lifespan

    sem_sessao = client.put("/api/admin/conteudo", json={"valores": {"hero_titulo": "Novo título"}})
    assert sem_sessao.status_code == 401

    login_admin(client)
    editado = client.put("/api/admin/conteudo", json={"valores": {"hero_titulo": "Novo título"}})
    assert editado.status_code == 200
    assert editado.json()["hero_titulo"] == "Novo título"
    assert client.get("/api/conteudo").json()["hero_titulo"] == "Novo título"


def test_conteudo_rejeita_chave_desconhecida(client):
    login_admin(client)
    resposta = client.put("/api/admin/conteudo", json={"valores": {"chave_que_nao_existe": "x"}})
    assert resposta.status_code == 400


def test_upload_aceita_imagem_valida_e_rejeita_arquivo_disfarcado(client):
    login_admin(client)

    from io import BytesIO

    from PIL import Image

    buffer = BytesIO()
    Image.new("RGB", (10, 10), color="red").save(buffer, format="PNG")
    valido = client.post(
        "/api/admin/upload", files={"arquivo": ("foto.png", buffer.getvalue(), "image/png")}
    )
    assert valido.status_code == 200
    assert valido.json()["url"].startswith("/uploads/")

    # Um .txt renomeado para .jpg não pode virar uma "imagem" válida.
    falso = client.post(
        "/api/admin/upload",
        files={"arquivo": ("foto.jpg", b"isto nao e uma imagem", "image/jpeg")},
    )
    assert falso.status_code == 400


def test_upload_exige_sessao(client):
    resposta = client.post(
        "/api/admin/upload", files={"arquivo": ("foto.png", b"conteudo", "image/png")}
    )
    assert resposta.status_code == 401


def test_upload_publica_url_https_quando_r2_esta_configurado(client, monkeypatch):
    login_admin(client)

    from io import BytesIO

    from PIL import Image

    from app import uploads

    enviado = {}

    def falso_enviar(conteudo: bytes, nome_arquivo: str, content_type: str) -> str:
        enviado["nome"] = nome_arquivo
        enviado["tipo"] = content_type
        enviado["bytes"] = conteudo
        return f"https://cdn.exemplo.test/{nome_arquivo}"

    monkeypatch.setattr(uploads, "r2_disponivel", lambda: True)
    monkeypatch.setattr(uploads, "enviar_para_r2", falso_enviar)

    buffer = BytesIO()
    Image.new("RGB", (10, 10), color="red").save(buffer, format="PNG")
    resposta = client.post(
        "/api/admin/upload", files={"arquivo": ("foto.png", buffer.getvalue(), "image/png")}
    )
    assert resposta.status_code == 200
    url = resposta.json()["url"]
    assert url.startswith("https://cdn.exemplo.test/")
    assert enviado["tipo"] == "image/png"
    assert enviado["bytes"]


def test_backup_sqlite_copia_arquivo_com_carimbo(tmp_path):
    from datetime import datetime

    from app.backup import copiar_backup_sqlite

    origem = tmp_path / "padaria.db"
    origem.write_bytes(b"sqlite-fake")
    destino = copiar_backup_sqlite(
        origem, tmp_path / "backups", agora=datetime(2026, 9, 18, 20, 40, 0)
    )
    assert destino.name == "padaria-20260918-204000.db"
    assert destino.read_bytes() == b"sqlite-fake"

