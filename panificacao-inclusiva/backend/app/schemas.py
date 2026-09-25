from pydantic import BaseModel, Field, field_validator


class ProdutoBase(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    categoria: str = Field(default="", max_length=60)
    badge: str = Field(default="", max_length=60)
    peso: str = Field(default="", max_length=60)
    descricao: str = Field(default="", max_length=500)
    preco: float = Field(ge=0)
    preco_detalhe: str = Field(default="", max_length=200)
    imagem_url: str = Field(default="", max_length=300)


class ProdutoCreate(ProdutoBase):
    pass


class ProdutoUpdate(ProdutoBase):
    pass


class ProdutoOut(ProdutoBase):
    id: int
    disponivel: bool

    model_config = {"from_attributes": True}


class DisponibilidadeIn(BaseModel):
    disponivel: bool


class ConfigOut(BaseModel):
    nome_loja: str
    whatsapp: str

    model_config = {"from_attributes": True}


class ConfigUpdate(BaseModel):
    nome_loja: str = Field(min_length=1, max_length=120)
    whatsapp: str = Field(min_length=8, max_length=20)
    nova_senha: str | None = Field(default=None)

    @field_validator("whatsapp")
    @classmethod
    def whatsapp_so_digitos(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("WhatsApp deve conter apenas dígitos (com DDI e DDD, ex: 5522981535778)")
        return v

    @field_validator("nova_senha")
    @classmethod
    def senha_tamanho(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        if len(v) < 4 or len(v) > 64:
            raise ValueError("A senha deve ter pelo menos 4 caracteres")
        return v


class LoginIn(BaseModel):
    usuario: str = Field(min_length=1, max_length=100)
    senha: str = Field(min_length=1, max_length=100)


class ConteudoUpdate(BaseModel):
    """Corpo livre: {"hero_titulo": "...", "essencia_texto": "...", ...}.
    Só chaves conhecidas (ver app.conteudo_padrao) são aceitas — impede
    que o formulário grave lixo arbitrário na tabela."""

    valores: dict[str, str]
