#!/usr/bin/env python3
"""Optimize product photos, upload to R2 produtos/, update padaria.db imagem_url."""

from __future__ import annotations

import re
import shutil
import sqlite3
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
ASSETS = Path(
    "/Users/ynacif31/.cursor/projects/Users-ynacif31-Work-Projects-trabalho-facul/assets"
)
OUT = ROOT / "public" / "produtos"
DB = BACKEND / "padaria.db"

MAX_EDGE = 800
JPEG_QUALITY = 85
WEBP_QUALITY = "80"
PUBLIC_BASE = "https://pub-7f81cf4ca4e246129e38af571fcf5533.r2.dev"

# product_id -> source filename in ASSETS
MAPPING: list[tuple[int, str, str]] = [
    (15, "6AF6B6C5-2EC4-4B5A-83AB-89164E57CD67_4_5005_c-e028b78d-0f86-47d3-ac0a-f06b502965d7.jpg", "pao-de-leite"),
    (4, "43CA5635-4E5F-4F99-9BEA-ABD26E7D148C_4_5005_c-f52fec36-0058-4b8a-9836-d22b7b7b3ecb.jpg", "fatias-hungaras"),
    (6, "AA712263-CBAA-49A8-9FEE-6269A8B8C859_4_5005_c-fc436f78-31ba-4958-9d5f-150571cf80f5.jpg", "babka-de-goiabada"),
    (20, "B592D763-5943-4820-9923-24110AA461B0_4_5005_c-74b7ee46-9c01-4a95-b28f-5ace48ce7223.jpg", "pao-de-ricota-tomate-seco"),
    (18, "9404B9ED-F578-462F-914F-7F5325AA5897_4_5005_c-f139aeba-a0c7-420e-a00a-1b029ad117f9.jpg", "pao-de-gorgonzola-damasco-mel"),
    (17, "0C88073A-CC19-4A22-B4C8-C54F152E098C_4_5005_c-bda8b6ea-6afc-454c-acd3-34c3183c52a8.jpg", "pao-multigranos"),
    (3, "895D486F-F18F-4E71-AB4D-0F70F8845B43_4_5005_c-fdf0a7c6-a1e1-4202-85e3-7fce30737162.jpg", "cinnamon-roll"),
    (21, "124AD4E1-5EE5-4904-A525-EF39C7EC6409_4_5005_c-385cca0b-c979-443b-b906-b6a96b9b74a7.jpg", "baguete-tradicional"),
    (12, "9EACCC4A-2D01-4BC1-AEE8-530334FAEA08_4_5005_c-c37c7fdc-515f-4e76-a5cf-bbcd4aa902e0.jpg", "pao-de-calabresa-e-queijo"),
    (14, "538667BC-BE88-4033-BA13-B824A6FC9DD1_4_5005_c-08a6d25f-e321-4610-9afd-0928cab0a0b5.jpg", "focaccia"),
    (2, "376C1657-758B-498D-A445-3B896F0A176C_4_5005_c-6965165c-acb3-46b5-9744-981bbc2b3404.jpg", "pao-de-banana-e-chocolate"),
    (13, "BAEE5EA7-4863-46EF-B05A-786691BDFFCB-7a20d818-ec8d-41f3-908f-18ff29f0046e.jpg", "pao-italiano"),
    (9, "E9FFEE6F-C60B-4B9D-A4EA-E268240E504C_4_5005_c-3df1f0a0-5034-48d3-94e0-b017277469d8.jpg", "pao-integral-multigranos"),
    (10, "B2EF7F2B-F08C-457A-900B-0DFC2FB9884D_4_5005_c-5e4c530c-2564-4b66-b2a9-037b07a86dfa.jpg", "brioche"),
    (11, "4B0B3BD1-F911-4FD1-AECB-312C7198BCF4_4_5005_c-7ccd1f8e-8052-42bd-a30b-5c8f8e7a3936.jpg", "mix-de-castanhas"),
]


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in path.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, raw = stripped.split("=", 1)
        values[key.strip()] = raw.strip().strip('"').strip("'")
    return values


def fit_long_edge(image: Image.Image, max_edge: int = MAX_EDGE) -> Image.Image:
    width, height = image.size
    longest = max(width, height)
    if longest <= max_edge:
        return image
    scale = max_edge / longest
    size = (max(1, int(width * scale)), max(1, int(height * scale)))
    return image.resize(size, Image.Resampling.LANCZOS)


def optimize(src: Path, stem: str) -> tuple[Path, Path]:
    OUT.mkdir(parents=True, exist_ok=True)
    fitted = fit_long_edge(Image.open(src))
    jpg = OUT / f"{stem}.jpg"
    webp = OUT / f"{stem}.webp"
    rgb = fitted.convert("RGB")
    rgb.save(jpg, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    cwebp = shutil.which("cwebp")
    if not cwebp:
        raise SystemExit("cwebp required")
    subprocess.run(
        [cwebp, "-q", WEBP_QUALITY, "-m", "6", str(jpg), "-o", str(webp)],
        check=True,
    )
    return jpg, webp


def build_client(env: dict[str, str]):
    import boto3

    account = env.get("R2_ACCOUNT_ID", "")
    endpoint = env.get("R2_ENDPOINT_URL") or f"https://{account}.r2.cloudflarestorage.com"
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=env["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=env["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
    )


def upload(client, bucket: str, public_base: str, path: Path) -> str:
    key = f"produtos/{path.name}"
    ct = "image/webp" if path.suffix == ".webp" else "image/jpeg"
    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=path.read_bytes(),
        ContentType=ct,
        CacheControl="public, max-age=31536000, immutable",
    )
    return f"{public_base.rstrip('/')}/{key}"


def main() -> None:
    env = load_env(BACKEND / ".env")
    public = env.get("R2_PUBLIC_URL") or PUBLIC_BASE
    client = build_client(env)
    bucket = env["R2_BUCKET"]

    urls: list[tuple[int, str, str]] = []
    for product_id, filename, stem in MAPPING:
        src = ASSETS / filename
        if not src.exists():
            raise SystemExit(f"missing source {src}")
        jpg, webp = optimize(src, stem)
        upload(client, bucket, public, jpg)
        url = upload(client, bucket, public, webp)
        urls.append((product_id, stem, url))
        print(f"ok id={product_id} {stem}.webp -> {url}")

    conn = sqlite3.connect(DB)
    try:
        for product_id, _stem, url in urls:
            conn.execute(
                "UPDATE produtos SET imagem_url = ? WHERE id = ?",
                (url, product_id),
            )
        conn.commit()
    finally:
        conn.close()

    print(f"\nupdated {len(urls)} produtos")


if __name__ == "__main__":
    main()
