#!/usr/bin/env python3
"""Export the YUEI brand logo `.ai` files (PDF-compatible) to trimmed SVGs.

`.ai` files saved with "PDF Compatible File" (the Illustrator default) are
valid single-page PDFs, so PyMuPDF (`fitz`) can open them directly. This
script:

1. Opens each source `.ai` file's first (only) page.
2. Computes the bounding box of the actual artwork (union of vector drawing
   rects and text/image block rects), ignoring the oversized blank page
   canvas the file was authored on.
3. Crops the page to that bounding box (`set_cropbox`) so the exported SVG
   has no surrounding whitespace.
4. Exports to SVG with `text_as_path=True` so no font is required to render
   the wordmark correctly, then strips the literal `width`/`height`
   attributes PyMuPDF writes on the root `<svg>`, leaving only `viewBox` so
   callers (CSS, `next/image` width/height) control the rendered size.

Usage:
    python assets-pipeline/scripts/logo/export_logo.py

Requires PyMuPDF; see requirements.txt in this directory
(`pip install -r assets-pipeline/scripts/logo/requirements.txt`).
"""

from __future__ import annotations

import re
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[3]
SRC_DIR = ROOT / "images" / "kingyo-bclublogo"
OUT_DIR = ROOT / "public" / "brand"

# (source .ai file, output .svg file)
EXPORTS = [
    (SRC_DIR / "YUEI_logo.ai", OUT_DIR / "yuei-logo.svg"),
    (SRC_DIR / "YUEI_logo-w.ai", OUT_DIR / "yuei-logo-white.svg"),
    (SRC_DIR / "YUEI_logo-nomi.ai", OUT_DIR / "yuei-mark.svg"),
]


def content_bbox(page: fitz.Page) -> fitz.Rect:
    """Union of the bounding boxes of every drawing and text/image block on
    the page -- i.e. the logo artwork itself, not the full authoring canvas.
    """
    bbox = fitz.Rect()
    for drawing in page.get_drawings():
        bbox |= drawing["rect"]
    for block in page.get_text("dict")["blocks"]:
        bbox |= fitz.Rect(block["bbox"])
    return bbox


def export(src: Path, dst: Path) -> None:
    doc = fitz.open(src)
    try:
        page = doc[0]
        bbox = content_bbox(page)
        page.set_cropbox(bbox)
        svg = page.get_svg_image(text_as_path=True)
        # Drop the literal width/height PyMuPDF writes on the root <svg> so
        # only viewBox remains; size is then set entirely by the caller.
        svg = re.sub(r'\swidth="[^"]*"', "", svg, count=1)
        svg = re.sub(r'\sheight="[^"]*"', "", svg, count=1)
        dst.write_text(svg, encoding="utf-8")
        print(f"{src.name} -> {dst.relative_to(ROOT)}  bbox={bbox}")
    finally:
        doc.close()


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src, dst in EXPORTS:
        export(src, dst)


if __name__ == "__main__":
    main()
