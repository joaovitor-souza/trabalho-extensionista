#!/usr/bin/env bash
# Remove unreferenced public/ assets after a full-repo grep (js/jsx/py/html/css).
# Re-run is safe (rm -f). Do not add files that LandingPage/Admin still serve.
#
# Confirmed unused on 2026-09-18:
#   public/page-*.png              (brand kit scans, never referenced)
#   public/hero_banner.png
#   public/crop_header.png
#   public/crop_hero.png
#   public/gallery_{1,2,3}.png
#   public/artisan_bread.png
#   public/visit_collage.png
#   public/custom_cakes.png
#   public/sweet_pastries.png
#   public/brand/photo_*.png       (6MB leftovers; JPG+WebP live on R2)
#   unused brand-kit extras        (no js/jsx/css/html refs)
#
# Kept (still referenced):
#   /brand/logo_dark_transparent.png
#   /brand/logo_light_transparent.png
#   /brand/stamp_clean_transparent.png
#   /brand/brand_monogram_dark.png
#   /whatsapp_logo.png
#   /whatsapp_icon_white.png
#   public/brand/photo_*.jpg       (local JPG fallback)
# WebP of the same photos lives on R2 only (regenerate with optimize-brand-photos.py).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ORPHANS=(
  public/artisan_bread.png
  public/crop_header.png
  public/crop_hero.png
  public/custom_cakes.png
  public/gallery_1.png
  public/gallery_2.png
  public/gallery_3.png
  public/hero_banner.png
  public/sweet_pastries.png
  public/visit_collage.png
  public/brand/page-01.png
  public/brand/page-02.png
  public/brand/page-03.png
  public/brand/page-04.png
  public/brand/page-05.png
  public/brand/page-06.png
  public/brand/page-07.png
  public/brand/page-08.png
  public/brand/page-09.png
  public/brand/page-10.png
  public/brand/page-11.png
  public/brand/page-12.png
  public/brand/page-13.png
  public/brand/page-14.png
  public/brand/photo_baker_apron.png
  public/brand/photo_circular_sign.png
  public/brand/photo_packaging_bread.png
  public/brand/photo_store_window.png
  public/brand/photo_storefront_awning.png
  public/brand/brand_pattern.png
  public/brand/brand_green_banner.png
  public/brand/brand_green_banner_clean.png
  public/brand/brand_stamp_beige.png
  public/brand/green_block.png
  public/brand/logo_horizontal_black.png
  public/brand/logo_horizontal_transparent.png
  public/brand/clean_logo_whitebg.png
  public/brand/clean_stamp_whitebg.png
  public/brand/stamp_black.png
  public/brand/stamp_exact_whitebg.png
  public/brand/stamp_transparent.png
)

removed=0
bytes=0
for path in "${ORPHANS[@]}"; do
  if [[ -f "$path" ]]; then
    size="$(wc -c < "$path" | tr -d ' ')"
    rm -f "$path"
    echo "removed $path ($size bytes)"
    removed=$((removed + 1))
    bytes=$((bytes + size))
  else
    echo "already gone $path"
  fi
done

echo "done: $removed files, $bytes bytes"
