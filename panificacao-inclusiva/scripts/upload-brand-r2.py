#!/usr/bin/env python3
"""Upload optimized brand photos to R2 prefix brand/ using backend/.env.

Does not print credential values. Only uploads files that exist locally.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
BRAND = ROOT / "public" / "brand"

UPLOAD_NAMES = (
    "brand_pattern_hero.webp",
    "brand_pattern_hero_tile.webp",
    "photo_hero_store.webp",
    "photo_hero_store.jpg",
    "photo_storefront_awning.webp",
    "photo_storefront_awning.jpg",
    "photo_store_window.webp",
    "photo_store_window.jpg",
    "photo_circular_sign.webp",
    "photo_circular_sign.jpg",
    "photo_packaging_bread.webp",
    "photo_packaging_bread.jpg",
    "photo_baker_apron.webp",
    "photo_baker_apron.jpg",
)


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in path.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, raw = stripped.split("=", 1)
        values[key.strip()] = raw.strip().strip('"').strip("'")
    return values


def build_client(env: dict[str, str]):
    import boto3

    account = env.get("R2_ACCOUNT_ID", "")
    endpoint = env.get("R2_ENDPOINT_URL") or f"https://{account}.r2.cloudflarestorage.com"
    required = ("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL")
    if not all(env.get(key) for key in required) or not account:
        raise SystemExit("R2 is not fully configured in backend/.env")
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=env["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=env["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
    )


def content_type_for(path: Path) -> str:
    if path.suffix.lower() == ".webp":
        return "image/webp"
    return "image/jpeg"


def upload_one(client, bucket: str, public_base: str, path: Path) -> str:
    key = f"brand/{path.name}"
    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=path.read_bytes(),
        ContentType=content_type_for(path),
        CacheControl="public, max-age=31536000, immutable",
    )
    return f"{public_base.rstrip('/')}/{key}"


def main() -> None:
    env = load_env(BACKEND / ".env")
    client = build_client(env)
    uploaded: list[str] = []
    for name in UPLOAD_NAMES:
        path = BRAND / name
        if not path.exists():
            print(f"skip missing {name}", file=sys.stderr)
            continue
        url = upload_one(client, env["R2_BUCKET"], env["R2_PUBLIC_URL"], path)
        kb = path.stat().st_size / 1024
        print(f"uploaded {name} ({kb:.1f} KB) -> {url}")
        uploaded.append(url)
    print(f"ok {len(uploaded)} files")


if __name__ == "__main__":
    main()
