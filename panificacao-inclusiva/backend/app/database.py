from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def garantir_coluna_senha_provisoria() -> None:
    """create_all não altera tabela existente — adiciona a flag em SQLite antigo."""
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.connect() as conn:
        colunas = conn.execute(text("PRAGMA table_info(config)")).fetchall()
        nomes = {linha[1] for linha in colunas}
        if nomes and "senha_provisoria" not in nomes:
            conn.execute(
                text("ALTER TABLE config ADD COLUMN senha_provisoria BOOLEAN NOT NULL DEFAULT 1")
            )
            conn.commit()
