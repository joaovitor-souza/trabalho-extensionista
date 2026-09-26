import secrets

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Sem valor padrão: SECRET_KEY tem que vir do .env / secret manager.
    secret_key: str = ""

    debug: bool = True

    database_url: str = "sqlite:///./padaria.db"

    # Lista de origens (separadas por vírgula) autorizadas a chamar a API
    # com cookies. Nunca "*" — allow_credentials exige allowlist explícita.
    cors_origins: str = "http://localhost:5173"

    # Credenciais iniciais, usadas só na primeira execução (quando a tabela
    # Config ainda não existe). A dona da padaria troca a senha depois em
    # Configurações — ver PUT /api/admin/config.
    admin_usuario_padrao: str = "admin"
    admin_senha_padrao: str = "admin123"
    nome_loja_padrao: str = "Natural Pani"
    whatsapp_padrao: str = "5522981535778"

    # Por quantas horas a sessão da dona da loja fica válida após o login.
    session_hours: int = 8

    # Configuração de cookies de sessão (auth).
    # Em dev: lax + insecure.
    # Em produção cross-site (front na Vercel, back no Railway): samesite="none", secure=True.
    # Em produção same-domain / VPS única (Nginx servindo front e proxyando /api):
    # samesite="lax", secure=True (ou False se for HTTP interno).
    # Deixar vazio para manter a detecção automática baseada em settings.debug.
    cookie_samesite: str = ""
    cookie_secure: bool | None = None

    # Limite de POST /api/admin/login: 5/minuto/IP. Desligado na suíte de testes.
    rate_limit_enabled: bool = True

    # Cloudflare R2 (S3-compatible). Se faltar qualquer uma, o upload
    # cai no disco local (/uploads) — útil em desenvolvimento.
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = ""
    r2_public_url: str = ""
    r2_endpoint_url: str = ""

    @property
    def r2_esta_configurado(self) -> bool:
        return all(
            [
                self.r2_account_id,
                self.r2_access_key_id,
                self.r2_secret_access_key,
                self.r2_bucket,
                self.r2_public_url,
            ]
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

if not settings.secret_key:
    if settings.debug:
        # Conveniência só para dev local: chave aleatória por processo.
        # Reiniciar o servidor invalida sessões abertas — aceitável em dev.
        settings.secret_key = secrets.token_hex(32)
    else:
        raise RuntimeError(
            "SECRET_KEY não definida. Defina uma variável de ambiente SECRET_KEY "
            "(gere com: python3 -c \"import secrets; print(secrets.token_hex(32))\") "
            "antes de subir com DEBUG=false."
        )
