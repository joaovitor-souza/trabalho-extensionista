#!/usr/bin/env python3
"""Convert used brand photos to WebP q80.

The baker apron keeps the full torso; the landing page uses object-position
to frame the pocket and breads. Landscape photos are resized to 1600px on
the long edge.
"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
CWEBP = shutil.which("cwebp")
MAX_EDGE = 1600
WEBP_QUALITY = "80"
JPEG_QUALITY = 82

LANDSCAPE = (
    "photo_storefront_awning",
    "photo_store_window",
    "photo_circular_sign",
    "photo_packaging_bread",
)


def require_cwebp() -> str:
    if not CWEBP:
        raise SystemExit("cwebp not found. Install with: brew install webp")
    return CWEBP


def source_png_or_jpg(stem: str) -> Path:
    png = BRAND / f"{stem}.png"
    jpg = BRAND / f"{stem}.jpg"
    if png.exists():
        return png
    if jpg.exists():
        return jpg
    raise FileNotFoundError(stem)


def run_cwebp(src: Path, dest: Path, extra: list[str]) -> None:
    cmd = [require_cwebp(), "-q", WEBP_QUALITY, "-m", "6", *extra, str(src), "-o", str(dest)]
    subprocess.run(cmd, check=True)


def write_jpeg_fallback(image: Image.Image, dest: Path) -> None:
    rgb = image.convert("RGB")
    rgb.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)


def fit_long_edge(image: Image.Image, max_edge: int = MAX_EDGE) -> Image.Image:
    width, height = image.size
    longest = max(width, height)
    if longest <= max_edge:
        return image
    scale = max_edge / longest
    size = (max(1, int(width * scale)), max(1, int(height * scale)))
    return image.resize(size, Image.Resampling.LANCZOS)


def optimize_landscape(stem: str) -> None:
    src = source_png_or_jpg(stem)
    fitted = fit_long_edge(Image.open(src))
    write_jpeg_fallback(fitted, BRAND / f"{stem}.jpg")
    extra = ["-resize", str(MAX_EDGE), "0"] if max(Image.open(src).size) > MAX_EDGE else []
    run_cwebp(src, BRAND / f"{stem}.webp", extra)


def optimize_baker() -> None:
    src = source_png_or_jpg("photo_baker_apron")
    fitted = fit_long_edge(Image.open(src))
    write_jpeg_fallback(fitted, BRAND / "photo_baker_apron.jpg")
    tmp = BRAND / "_baker_opt_tmp.jpg"
    write_jpeg_fallback(fitted, tmp)
    run_cwebp(tmp, BRAND / "photo_baker_apron.webp", [])
    tmp.unlink(missing_ok=True)


def report(path: Path) -> str:
    kb = path.stat().st_size / 1024
    return f"{path.name:36} {kb:7.1f} KB"


def main() -> None:
    BRAND.mkdir(parents=True, exist_ok=True)
    for stem in LANDSCAPE:
        optimize_landscape(stem)
        print(report(BRAND / f"{stem}.jpg"))
        print(report(BRAND / f"{stem}.webp"))
    optimize_baker()
    print(report(BRAND / "photo_baker_apron.jpg"))
    print(report(BRAND / "photo_baker_apron.webp"))


if __name__ == "__main__":
    main()
