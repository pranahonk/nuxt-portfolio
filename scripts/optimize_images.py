#!/usr/bin/env python3
"""
Optimize images for the portfolio:
- Generate responsive widths (default: 3840, 2560, 1920, 1280, 960, 640)
- Convert to WebP
- Strip metadata
- Preserve transparency when present
- Skip upscaling
- Skip if output exists and is newer than the source

Usage:
  python3 scripts/optimize_images.py --src assets/image/Portfolio --widths 3840,2560,1920,1280,960,640 --quality 82

Notes:
- Requires Pillow with WebP support.
- Outputs beside the source as `<name>-<width>.webp`.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Iterable, List, Tuple

from PIL import Image, ImageOps

SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
DEFAULT_WIDTHS = [3840, 2560, 1920, 1280, 960, 640]


def parse_widths(s: str | None) -> List[int]:
    if not s:
        return DEFAULT_WIDTHS
    try:
        widths = [int(x) for x in s.split(",") if x.strip()]
    except ValueError:
        raise argparse.ArgumentTypeError("--widths must be a comma-separated list of integers")
    return sorted(set(widths), reverse=True)


def iter_images(src: Path) -> Iterable[Path]:
    for p in src.rglob("*"):
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTS:
            yield p


def should_skip(src: Path, out: Path) -> bool:
    return out.exists() and out.stat().st_mtime >= src.stat().st_mtime


def calc_target_size(img: Image.Image, target_w: int) -> Tuple[int, int]:
    w, h = img.size
    if w <= target_w:
        # No upscaling
        return w, h
    target_h = int(round(h * (target_w / w)))
    return target_w, target_h


def to_webp(img: Image.Image, out_path: Path, quality: int, lossless_for_png: bool) -> None:
    params = {
        "format": "WEBP",
        "method": 6,  # best compression
        "optimize": True,
        "quality": quality,
        "icc_profile": None,
    }
    if lossless_for_png and img.mode in ("RGBA", "LA"):
        params.update({"lossless": True, "quality": 100})
    # Ensure RGB/RGBA modes
    if img.mode in ("P", "L") and "A" not in img.mode:
        img = img.convert("RGB")
    if img.mode == "LA":
        img = img.convert("RGBA")
    # Remove metadata
    img.info.clear()
    img.save(out_path, **params)


def process_one(src_path: Path, widths: List[int], quality: int, dry_run: bool) -> List[Path]:
    created: List[Path] = []
    try:
        with Image.open(src_path) as im:
            im = ImageOps.exif_transpose(im)
            base = src_path.with_suffix("")
            is_png_like = src_path.suffix.lower() == ".png" or ("A" in im.getbands())
            for w in widths:
                tw, th = calc_target_size(im, w)
                # Skip generating redundant sizes
                if tw < 1 or th < 1:
                    continue
                out_path = base.parent / f"{base.name}-{tw}.webp"
                if should_skip(src_path, out_path):
                    continue
                if dry_run:
                    created.append(out_path)
                    continue
                # High-quality Lanczos resize
                to_save = im
                if (tw, th) != im.size:
                    to_save = im.resize((tw, th), Image.Resampling.LANCZOS)
                to_webp(to_save, out_path, quality=quality, lossless_for_png=is_png_like)
                created.append(out_path)
    except Exception as e:
        print(f"[ERROR] {src_path}: {e}", file=sys.stderr)
    return created


def main():
    parser = argparse.ArgumentParser(description="Optimize images to responsive WebP variants")
    parser.add_argument("--src", default="assets/image/Portfolio", help="Source directory to scan")
    parser.add_argument("--widths", default=None, help="Comma-separated list of widths, e.g., 1920,1280,640")
    parser.add_argument("--quality", type=int, default=82, help="WebP quality for photos (ignored if lossless)")
    parser.add_argument("--dry", action="store_true", help="Dry run: print what would be created")

    args = parser.parse_args()

    src = Path(args.src)
    if not src.exists() or not src.is_dir():
        print(f"Source directory not found: {src}", file=sys.stderr)
        return 1

    widths = parse_widths(args.widths)

    print(f"Scanning {src} for images...")
    total = 0
    created_total = 0
    for p in iter_images(src):
        total += 1
        created = process_one(p, widths=widths, quality=args.quality, dry_run=args.dry)
        created_total += len(created)
        for out in created:
            print(f"+ {out.relative_to(Path.cwd()) if Path.cwd() in out.parents else out}")

    print(f"Done. Processed {total} images. Created {created_total} files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
