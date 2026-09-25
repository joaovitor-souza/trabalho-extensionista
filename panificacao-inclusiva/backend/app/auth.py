from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import HTTPException, Request, Response, status

from app.config import settings

ALGORITHM = "HS256"
ISSUER = "panificacao-inclusiva-api"
AUDIENCE = "panificacao-inclusiva-admin"
COOKIE_NAME = "session"


def hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(senha.encode("utf-8"), senha_hash.encode("utf-8"))


def usuarios_iguais(informado: str, esperado: str) -> bool:
    return informado.strip().lower() == esperado.strip().lower()


def criar_token_sessao() -> str:
    agora = datetime.now(timezone.utc)
    payload = {
        "sub": "admin",
        "iss": ISSUER,
        "aud": AUDIENCE,
        "iat": agora,
        "exp": agora + timedelta(hours=settings.session_hours),
    }
    # ALGORITHM é fixo aqui, nunca lido do token — fecha a brecha do "alg: none".
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decodificar_token_sessao(token: str) -> dict:
    return jwt.decode(
        token,
        settings.secret_key,
        algorithms=[ALGORITHM],
        issuer=ISSUER,
        audience=AUDIENCE,
    )


def definir_cookie_sessao(response: Response, token: str) -> None:
    # Em produção cross-site (ex: vercel.app / railway.app), o cookie só é enviado
    # pelo navegador com SameSite="none" + Secure.
    # Em VPS com mesmo domínio / reverse proxy (ex: loja.site.com e /api no mesmo host),
    # SameSite="lax" é muito mais seguro e compatível com navegadores estritos.
    # As variáveis COOKIE_SAMESITE e COOKIE_SECURE permitem ajuste fino sem alterar código.
    samesite_val = (
        settings.cookie_samesite.lower()
        if settings.cookie_samesite
        else ("none" if not settings.debug else "lax")
    )
    secure_val = (
        settings.cookie_secure
        if settings.cookie_secure is not None
        else (not settings.debug)
    )

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=secure_val,
        samesite=samesite_val,
        max_age=settings.session_hours * 3600,
        path="/",
    )


def limpar_cookie_sessao(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/")


def payload_sessao(must_change_password: bool) -> dict:
    return {
        "ok": True,
        "usuario": settings.admin_usuario_padrao,
        "must_change_password": must_change_password,
    }


def exigir_sessao(request: Request) -> dict:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão não encontrada")
    try:
        return decodificar_token_sessao(token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão inválida ou expirada")
