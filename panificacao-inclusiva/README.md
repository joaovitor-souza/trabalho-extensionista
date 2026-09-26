# Panificação Inclusiva — Natural Pani

Vitrine digital e painel de gestão da **Natural Pani**, padaria artesanal de fermentação natural em **Rio das Ostras (RJ)**. Trabalho extensionista: aproximar a dona da loja da internet sem exigir conhecimento técnico, e o cliente do cardápio sem passar por um checkout.

O site público apresenta o ateliê com o texto institucional da própria marca — *“Pães artesanais de fermentação natural em Rio das Ostras”*, endereço **Rua São Fidélis, 57 — Recreio, Rio das Ostras — RJ**, essência baseada em água, farinha, tempo e levain, e o anúncio do espaço físico / cafeteria com lançamento previsto para **2027**. Enquanto a loja física não abre, as fornadas seguem sob encomenda para entrega e retirada. O pedido não é processado neste sistema: o cliente abre uma conversa no **WhatsApp** da loja.

---

## 1. Objetivo social e extensionista

A Natural Pani já vende pelo relacionamento direto (WhatsApp), não por e-commerce. O problema de extensão não é “criar um marketplace”, e sim **digitalizar o que a vendedora já faz à mão**:

- publicar um cardápio que o cliente consulta no celular ou no computador;
- manter preço, texto e foto atualizados sem editar código;
- encaminhar o pedido para o canal que a loja já usa (`wa.me`), com mensagem pronta.

O impacto esperado é inclusão digital de um negócio artesanal de pequeno porte: a dona administra o site pelo painel (`#admin`); o público encontra o cardápio sem depender de postagem avulsa em rede social; a conversa comercial permanece no WhatsApp, o meio que a comunidade local já conhece.

Este repositório é o artefato técnico do projeto **Panificação Inclusiva** (API: *Panificação Inclusiva — API*).

---

## 2. Arquitetura

O frontend é uma SPA **Vite + React**. O backend é **FastAPI** (Uvicorn), com persistência em **SQLite** (SQLAlchemy) e validação de imagem no upload via **Pillow**. Quando as variáveis do Cloudflare R2 estão preenchidas, as fotos vão para o bucket (URL pública em `*.r2.dev` ou domínio próprio); caso contrário, o arquivo fica em `/uploads` no disco do backend.

```
  Cliente (navegador)
           |
           |  http://localhost:5173   (npm run dev → Vite)
           v
  +------------------+     VITE_API_URL      +---------------------------+
  | React (Vite)     |  ------------------>  | FastAPI                   |
  | Landing pública  |  http://localhost     | uvicorn app.main:app      |
  | Painel #admin    |         :8123         | cookie HttpOnly (session) |
  +------------------+                       +-------------+-------------+
                                                          |
                    +-------------------------------------+--------------------------------------+
                    |                                     |                                      |
                    v                                     v                                      v
           +----------------+                    +----------------+                    +------------------+
           | SQLite         |                    | Pillow         |                    | Cloudflare R2    |
           | padaria.db     |                    | valida JPG/    |                    | se R2_* no .env  |
           | produtos       |                    | PNG/WEBP/GIF   |                    | senão disco      |
           | config         |                    | até 5 MB       |                    | /uploads         |
           | conteudo_site  |                    +----------------+                    +------------------+
           +----------------+
```

Fluxo do pedido WhatsApp (sem carrinho e sem pagamento neste sistema):

1. A landing busca `GET /api/config` (número) e `GET /api/produtos` (itens disponíveis).
2. Botões gerais usam a mensagem *“Olá! Gostaria de fazer uma encomenda no cardápio da Natural Pani.”*
3. O botão **PEDIR** de cada produto monta `https://wa.me/{numero}?text=...` com nome e preço.
4. O navegador abre o WhatsApp; a conversa continua fora da aplicação.

O painel administrativo **não é uma rota de servidor**. `src/App.jsx` troca a tela quando o hash da URL é `#admin` (link discreto no rodapé: *Painel da Vendedora*).

---

## 3. Pré-requisitos

- Node.js compatível com o `package.json` do frontend
- Python **3.12+** (`backend/pyproject.toml`: `requires-python = ">=3.12"`)
- Conta/bucket R2 apenas se quiser upload persistente em nuvem (opcional em desenvolvimento)

---

## 4. Quickstart — backend

O frontend espera a API em **`http://localhost:8123`** (`.env.development` e fallback em `src/api.js`). O `Procfile` de produção usa `--port $PORT`; em local o porto precisa coincidir com `VITE_API_URL`.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
```

Edite `backend/.env` (veja a seção 6). Gere `SECRET_KEY` com:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Suba a API (mesmo comando observado no ambiente local do projeto):

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8123
```

O lockfile `uv.lock` foi gerado com **uv**. Alternativa ao `venv` + `pip`:

```bash
cd backend
uv sync --group dev
uv run uvicorn app.main:app --host 127.0.0.1 --port 8123
```

Na primeira execução o FastAPI cria as tabelas e, **somente se a tabela `config` estiver vazia**, grava nome da loja, WhatsApp e senha iniciais. Banco já existente **não** é reescrito pelo seed.

Com `DEBUG=true`, a documentação interativa fica em `http://127.0.0.1:8123/docs`. Em produção (`DEBUG=false`) `/docs`, `/redoc` e `/openapi.json` são desligados.

---

## 5. Quickstart — frontend

Na raiz de `panificacao-inclusiva`:

```bash
npm install
npm run dev
```

O Vite sobe em **`http://localhost:5173`** (padrão do Vite; `vite.config.js` não redefine a porta). Essa origem é a allowlist padrão de CORS (`CORS_ORIGINS` em `backend/.env.example`).

Outros scripts do `package.json`:

| Script | Comando real | Uso |
|---|---|---|
| `npm run dev` | `vite` | desenvolvimento |
| `npm run build` | `vite build` | build de produção |
| `npm run preview` | `vite preview` | pré-visualizar o build |
| `npm run lint` | `eslint .` | lint |
| `npm test` | `node --test src/*.test.js` | testes do fallback da landing |

O arquivo `.env.development` define `VITE_API_URL=http://localhost:8123`. Cookies de sessão exigem `credentials: "include"` (já configurado em `src/api.js`).

---

## 6. Variáveis de ambiente

Documentam-se **apenas os nomes**. Copie `backend/.env.example` para `backend/.env` e preencha. **Não commite o `.env`.**

| Variável | Função |
|---|---|
| `SECRET_KEY` | Assinatura do JWT de sessão. Obrigatória com `DEBUG=false`. |
| `DEBUG` | `true` em local (libera `/docs` e cookie `SameSite=Lax`). `false` em produção (cookie `Secure` + `SameSite=None`). |
| `DATABASE_URL` | Padrão: `sqlite:///./padaria.db`. |
| `CORS_ORIGINS` | Origens do frontend, separadas por vírgula. Padrão local: `http://localhost:5173`. |
| `ADMIN_USUARIO_PADRAO` | Usuário do login (não fica no banco). |
| `ADMIN_SENHA_PADRAO` | Senha usada **só no seed** da primeira execução. |
| `NOME_LOJA_PADRAO` | Nome inicial da loja (`Natural Pani`). |
| `WHATSAPP_PADRAO` | DDI+DDD+número, só dígitos (ex. do site: `5522981535778`). |
| `SESSION_HOURS` | Validade do cookie de sessão (padrão: 8). |
| `R2_ACCOUNT_ID` | Conta Cloudflare R2. |
| `R2_ACCESS_KEY_ID` | Chave de acesso S3-compatível. |
| `R2_SECRET_ACCESS_KEY` | Segredo da chave. |
| `R2_BUCKET` | Nome do bucket. |
| `R2_PUBLIC_URL` | URL pública do bucket (`https://….r2.dev` ou domínio próprio), sem barra final. |
| `R2_ENDPOINT_URL` | Opcional. Padrão: `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`. |

Se faltar qualquer uma de `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` ou `R2_PUBLIC_URL`, o upload cai no disco (`/uploads`). Imagens de marca e produto **podem** viver em host `r2.dev` quando o R2 está configurado.

Frontend (raiz do projeto):

| Variável | Função |
|---|---|
| `VITE_API_URL` | Base da API. Local: `http://localhost:8123`. |

---

## 7. Persistência (SQLite)

Não há `SQLITE.md` / `ARQUITETURA.md` neste repositório no momento da redação. O comportamento abaixo vem do código (`backend/app/database.py`, `models.py`, `main.py`).

- Motor: **SQLite** via SQLAlchemy; arquivo padrão `backend/padaria.db`.
- Tabelas criadas em `lifespan` com `Base.metadata.create_all` (sem migrações versionadas).
- **`produtos`**: cardápio (nome, categoria, badge, peso, descrição, preço, detalhe de preço, URL da imagem, `disponivel`). A listagem pública filtra só `disponivel = true`.
- **`config`**: linha única (`id = 1`) com `nome_loja`, `whatsapp` e hash da senha. A coluna física do hash continua chamada `pin_hash` (compatibilidade com banco antigo); o usuário do login vem de `ADMIN_USUARIO_PADRAO`.
- **`conteudo_site`**: pares chave/valor do texto e das imagens da landing (hero, essência, espaço, galeria, rodapé). Chaves novas exigem entrada em `app/conteudo_padrao.py` — o `PUT /api/admin/conteudo` rejeita chave desconhecida.

O seed **não atualiza** banco já populado. Trocar a senha de um SQLite antigo é feito pelo painel (aba **Configurações**) ou por `UPDATE` autorizado no arquivo local — o aplicativo não executa esse SQL sozinho.

---

## 8. Autenticação do painel

- `POST /api/admin/login` recebe `{ "usuario", "senha" }` e grava cookie **HttpOnly** `session` (JWT HS256).
- Rotas `/api/admin/*` (exceto login) exigem o cookie (`GET /api/admin/me` confirma a sessão).
- Há um único usuário efetivo (variável de ambiente). A senha, depois do seed, vive só no hash bcrypt.
- **Login local atual (após atualização do banco): `admin` / `admin123`.** Troque essa senha na aba Configurações antes de qualquer uso real. Não reutilize essa combinação em produção.

---

## 9. Roteiro de demonstração (cerca de 3 minutos)

Pré-requisito: backend em `:8123` e frontend em `:5173`.

| Tempo | O quê mostrar |
|---|---|
| 0:00–0:40 | **Catálogo no desktop.** Abra `http://localhost:5173`. Percorra Início, Essência e Produtos. Destaque o aviso de Rio das Ostras, o endereço e o anúncio do espaço físico em 2027. |
| 0:40–1:10 | **Catálogo no mobile.** Estreite a janela (o menu vira botão hamburger abaixo de 640 px). Abra o menu, vá a Produtos, arraste o carrossel e mostre o botão flutuante do WhatsApp. |
| 1:10–1:40 | **Pedido WhatsApp.** Clique em **PEDIR** num pão. Deve abrir `wa.me` com nome e preço. Os CTAs *Pedir agora* / botão flutuante usam a mensagem genérica de encomenda. Não há checkout neste sistema. |
| 1:40–2:20 | **Painel.** No rodapé, *Painel da Vendedora*, ou abra `http://localhost:5173/#admin`. Entre com `admin` / `admin123` e **avise que essa senha deve ser trocada**. Abas: Cardápio de Pães, Conteúdo do Site, Configurações. |
| 2:20–2:45 | **Preço e texto ao vivo.** Na aba Cardápio, altere o preço de um item e salve. Na aba Conteúdo, altere o título do hero. Volte a `#` (loja), recarregue: o catálogo e o texto vêm de `GET /api/produtos` e `GET /api/conteudo`. |
| 2:45–3:00 | **Testes.** No backend: `pytest`. No frontend: `npm test`. |

---

## 10. Testes

Backend (a partir de `backend/`; `pyproject.toml` define `pythonpath = ["."]` e o grupo `dev` com `pytest` e `httpx`):

```bash
cd backend
source .venv/bin/activate
pip install pytest httpx     # se o venv foi criado só com requirements.txt (sem o grupo dev)
pytest
```

Com uv:

```bash
cd backend
uv sync --group dev
uv run pytest
```

A suíte usa banco isolado (`test_padaria.db`) e **desliga o R2** no `conftest.py`, para o upload de teste não ir ao bucket real.

Frontend (raiz):

```bash
npm test
```

Cobre o fallback da landing (conteúdo padrão, WhatsApp `wa.me`, resolução de `/uploads` e imagens em `r2.dev`).

---

## 11. Limitações e próximos passos

**SQLite.** Adequado a um único processo e disco persistente. Em host com filesystem efêmero o arquivo some a cada deploy. O próprio `.env.example` aponta, para esse caso, um Postgres gerenciado.

**R2.** Upload durável depende das variáveis `R2_*`. Sem elas, as fotos ficam em `backend/uploads/` e não acompanham um servidor sem volume. O front já resolve URLs `https://` (incluindo `r2.dev`) e prefixa `/uploads/` com `VITE_API_URL`.

**Auth.** Um usuário só; senha mínima de 4 caracteres; `SECRET_KEY` aleatória por processo se estiver vazia em `DEBUG=true` (reiniciar o servidor invalida sessões). Não há recuperação de senha, 2FA nem auditoria de alterações. A senha padrão de demonstração **deve ser trocada**.

**Escopo de negócio.** Não há carrinho, pagamento, estoque automático nem histórico de pedidos — o WhatsApp é o sistema de encomenda. O catálogo público esconde itens indisponíveis; o painel lista todos.

**Próximos passos razoáveis:** senha forte + `SECRET_KEY` fixa em produção; Postgres se o disco não persistir; manter R2 (ou equivalente) para imagem; eventualmente um segundo perfil de acesso ou registro simples de encomendas, sem abandonar o WhatsApp como canal da loja.

---

## 12. Deploy na VPS (junto com o PDV ou outros serviços)

O projeto está pronto para subir na mesma VPS via Docker Compose sem colidir com outros aplicativos (como o PDV):

1. **Arquivos incluídos:**
   - `docker-compose.yml`: orquestra backend FastAPI e frontend React (Nginx) com portas customizáveis e volumes persistentes (`naturalpani_sqlite_data` e `naturalpani_uploads_data`).
   - `.env.production.example`: modelo pronto com as variáveis de ambiente para a VPS.
   - `vps-nginx.conf.example`: exemplo de configuração para o Nginx da VPS fazer o proxy reverso por subdomínio (ex: `cardapio.minhaloja.com.br`).

2. **Como subir na VPS:**
   ```bash
   # 1. Copie o template de variáveis de produção
   cp .env.production.example .env

   # 2. Gere uma chave segura e adicione no .env:
   python3 -c "import secrets; print(secrets.token_hex(32))"

   # 3. Configure as portas desejadas no .env (padrão: frontend 8080, backend 8123)
   # 4. Inicie os containers em segundo plano:
   docker compose up -d --build
   ```

3. **Proxy Reverso com SSL (Nginx + Certbot):**
   - Use o arquivo `vps-nginx.conf.example` no Nginx da VPS para apontar seu domínio/subdomínio para `127.0.0.1:8080` e a rota `/api/` para `127.0.0.1:8123`.
   - Gere o certificado SSL gratuito com `certbot --nginx -d cardapio.minhaloja.com.br`.

---

## 13. Rotas úteis (referência)

Públicas: `GET /api/produtos`, `GET /api/config`, `GET /api/conteudo`.

Admin (cookie): `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/me`, CRUD em `/api/admin/produtos`, `PATCH /api/admin/produtos/{id}/disponibilidade`, `PUT /api/admin/config`, `PUT /api/admin/conteudo`, `POST /api/admin/upload`.

Frontend: `/` (landing) e `/#admin` (painel).

