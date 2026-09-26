import io
import uuid
from pathlib import Path

from fastapi import HTTPException, status
from PIL import Image, UnidentifiedImageError

from app.config import settings

MAX_BYTES = 5 * 1024 * 1024  # 5MB
EXTENSAO_POR_FORMATO = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp", "GIF": ".gif"}
CONTENT_TYPE_POR_FORMATO = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
    "GIF": "image/gif",
}
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"


def r2_disponivel() -> bool:
    return settings.r2_esta_configurado


def enviar_para_r2(conteudo: bytes, nome_arquivo: str, content_type: str) -> str:
    """Sobe o arquivo para o bucket R2 e devolve a URL pública absoluta."""
    import boto3

    endpoint = settings.r2_endpoint_url or (
        f"https://{settings.r2_account_id}.r2.cloudflarestorage.com"
    )
    cliente = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )
    cliente.put_object(
        Bucket=settings.r2_bucket,
        Key=nome_arquivo,
        Body=conteudo,
        ContentType=content_type,
    )
    return f"{settings.r2_public_url.rstrip('/')}/{nome_arquivo}"


def _validar_imagem(conteudo: bytes) -> str:
    if len(conteudo) > MAX_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Imagem maior que 5MB")

    try:
        imagem = Image.open(io.BytesIO(conteudo))
        imagem.verify()
        formato = imagem.format
    except UnidentifiedImageError:
        formato = None

    if formato not in EXTENSAO_POR_FORMATO:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Arquivo não é uma imagem válida (use JPG, PNG, WEBP ou GIF)",
        )
    return formato


def salvar_imagem(conteudo: bytes) -> str:
    """Valida que os bytes são mesmo uma imagem decodificável (nunca confia
    na extensão/Content-Type enviados pelo navegador) e salva com um nome
    aleatório — no R2 quando configurado, ou em /uploads no disco local."""
    formato = _validar_imagem(conteudo)
    nome_arquivo = f"{uuid.uuid4().hex}{EXTENSAO_POR_FORMATO[formato]}"
    content_type = CONTENT_TYPE_POR_FORMATO[formato]

    if r2_disponivel():
        return enviar_para_r2(conteudo, nome_arquivo, content_type)

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / nome_arquivo).write_bytes(conteudo)
    return f"/uploads/{nome_arquivo}"
