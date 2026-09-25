import os

# Precisa rodar antes de qualquer `import app.*` — pydantic-settings lê o
# ambiente na primeira importação de app.config.
os.environ.setdefault("SECRET_KEY", "test-secret-key-nao-usar-em-producao")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_padaria.db")
os.environ.setdefault("ADMIN_USUARIO_PADRAO", "admin")
os.environ.setdefault("ADMIN_SENHA_PADRAO", "admin123")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")
# Isola a suíte do .env local: sem isto o upload de teste iria para o R2 real.
os.environ["R2_ACCOUNT_ID"] = ""
os.environ["R2_ACCESS_KEY_ID"] = ""
os.environ["R2_SECRET_ACCESS_KEY"] = ""
os.environ["R2_BUCKET"] = ""
os.environ["R2_PUBLIC_URL"] = ""
os.environ["R2_ENDPOINT_URL"] = ""

import shutil

import pytest


@pytest.fixture(scope="session", autouse=True)
def _limpar_banco_de_teste():
    yield
    caminho = "test_padaria.db"
    if os.path.exists(caminho):
        os.remove(caminho)
    from app.uploads import UPLOAD_DIR

    shutil.rmtree(UPLOAD_DIR, ignore_errors=True)
