from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Produto(Base):
    __tablename__ = "produtos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    categoria: Mapped[str] = mapped_column(String(60), default="")
    badge: Mapped[str] = mapped_column(String(60), default="")
    peso: Mapped[str] = mapped_column(String(60), default="")
    descricao: Mapped[str] = mapped_column(String(500), default="")
    preco: Mapped[float] = mapped_column(Float, nullable=False)
    preco_detalhe: Mapped[str] = mapped_column(String(200), default="")
    imagem_url: Mapped[str] = mapped_column(String(300), default="")
    disponivel: Mapped[bool] = mapped_column(Boolean, default=True)


class Config(Base):
    """Linha única (id sempre 1) com os dados estruturais da loja."""

    __tablename__ = "config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome_loja: Mapped[str] = mapped_column(String(120), nullable=False)
    whatsapp: Mapped[str] = mapped_column(String(20), nullable=False)
    # Coluna física continua `pin_hash` para o SQLite já existente
    # não precisar de ALTER/RENAME. O usuário fica em ADMIN_USUARIO_PADRAO.
    senha_hash: Mapped[str] = mapped_column("pin_hash", String(60), nullable=False)
    # True enquanto a senha ainda é a provisória do seed — o painel exige troca.
    senha_provisoria: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class ConteudoSite(Base):
    """Pares chave/valor para todo o texto e imagem editável da página
    pública (hero, essência, espaço, galeria, rodapé) — mesmo padrão do
    wp_options do WordPress: adicionar uma chave nova nunca exige migração."""

    __tablename__ = "conteudo_site"

    chave: Mapped[str] = mapped_column(String(60), primary_key=True)
    valor: Mapped[str] = mapped_column(Text, default="")
