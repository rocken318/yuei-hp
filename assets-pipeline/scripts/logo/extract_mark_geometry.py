#!/usr/bin/env python3
"""Extract the YUEI mark geometry from `public/brand/yuei-mark.svg` into
`lib/brand/mark-geometry.ts`.

The exported mark is made of:

* 3 flat `<path>` faces for the pillar (left, right, top), each with a
  `transform="matrix(...)"`.
* 6 "flying pieces", each an embedded raster gradient (`<image>`) clipped to
  a quadrilateral `<clipPath>`.

The hero animation re-draws the mark as native SVG (so each piece can move
independently and use a crisp `<linearGradient>`), so this script:

1. Parses each clipPath / face path (`M`/`L`/`H`/`V`/`Z` commands only — that
   is all the export contains) and applies its transform so every point is in
   the root viewBox space.
2. Estimates each piece's gradient direction from its embedded PNG by fitting
   a linear luminance plane (least squares) over the pixels inside the clip
   polygon. The gradient runs light (sky) -> dark (navy); its endpoints are
   the polygon's extent projected onto that direction.

Usage:
    python assets-pipeline/scripts/logo/extract_mark_geometry.py

Requires PyMuPDF (to decode the embedded PNGs); see requirements.txt.
"""

from __future__ import annotations

import base64
import json
import math
import re
import xml.etree.ElementTree as ET
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "public" / "brand" / "yuei-mark.svg"
OUT = ROOT / "lib" / "brand" / "mark-geometry.ts"

SVG_NS = "{http://www.w3.org/2000/svg}"
XLINK_HREF = "{http://www.w3.org/1999/xlink}href"

# Pillar faces in document order, named by what they depict.
FACE_NAMES = ["left", "right", "top"]

Matrix = tuple[float, float, float, float, float, float]
Point = tuple[float, float]


def parse_matrix(attr: str | None) -> Matrix:
    if not attr:
        return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    m = re.fullmatch(r"\s*matrix\(([^)]*)\)\s*", attr)
    if not m:
        raise ValueError(f"unsupported transform: {attr}")
    vals = [float(v) for v in re.split(r"[\s,]+", m.group(1).strip())]
    return (vals[0], vals[1], vals[2], vals[3], vals[4], vals[5])


def apply(m: Matrix, p: Point) -> Point:
    a, b, c, d, e, f = m
    x, y = p
    return (a * x + c * y + e, b * x + d * y + f)


def parse_path(d: str) -> list[Point]:
    """Parse an absolute M/L/H/V/Z path into a single polygon."""
    tokens = re.findall(r"[MLHVZmlhvz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?", d)
    pts: list[Point] = []
    cmd = ""
    i = 0
    x = y = 0.0

    def num() -> float:
        nonlocal i
        v = float(tokens[i])
        i += 1
        return v

    while i < len(tokens):
        t = tokens[i]
        if t.isalpha():
            if t.islower() and t not in ("z",):
                raise ValueError(f"relative commands unsupported: {t}")
            cmd = t.upper()
            i += 1
            if cmd == "Z":
                continue
        if cmd in ("M", "L"):
            x, y = num(), num()
            pts.append((x, y))
            cmd = "L"  # implicit lineto after moveto
        elif cmd == "H":
            x = num()
            pts.append((x, y))
        elif cmd == "V":
            y = num()
            pts.append((x, y))
        else:
            raise ValueError(f"unexpected token {t!r} in {d!r}")
    return pts


def point_in_poly(p: Point, poly: list[Point]) -> bool:
    x, y = p
    inside = False
    n = len(poly)
    for k in range(n):
        x1, y1 = poly[k]
        x2, y2 = poly[(k + 1) % n]
        if (y1 > y) != (y2 > y):
            xi = x1 + (y - y1) * (x2 - x1) / (y2 - y1)
            if x < xi:
                inside = not inside
    return inside


def gradient_for(image: ET.Element, poly: list[Point]) -> dict[str, float]:
    """Fit luminance = a*x + b*y + c over the clipped pixels; return the
    light -> dark gradient vector spanning the polygon."""
    href = image.get(XLINK_HREF) or image.get("href") or ""
    data = base64.b64decode(re.sub(r"\s+", "", href.split(",", 1)[1]))
    pix = fitz.Pixmap(data)
    ix, iy = float(image.get("x", 0)), float(image.get("y", 0))
    iw, ih = float(image.get("width")), float(image.get("height"))
    n = pix.n
    samples = pix.samples

    sxx = sxy = syy = sx = sy = s1 = sxl = syl = sl = 0.0
    for py in range(pix.height):
        for px in range(pix.width):
            vx = ix + (px + 0.5) * iw / pix.width
            vy = iy + (py + 0.5) * ih / pix.height
            if not point_in_poly((vx, vy), poly):
                continue
            o = (py * pix.width + px) * n
            r, g, b = samples[o], samples[o + 1], samples[o + 2]
            lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
            sxx += vx * vx
            sxy += vx * vy
            syy += vy * vy
            sx += vx
            sy += vy
            s1 += 1
            sxl += vx * lum
            syl += vy * lum
            sl += lum

    # Solve the 3x3 normal equations for (a, b, c) with Cramer's rule.
    A = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, s1]]
    B = [sxl, syl, sl]

    def det3(M: list[list[float]]) -> float:
        return (
            M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1])
            - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0])
            + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
        )

    D = det3(A)
    a = det3([[B[0], A[0][1], A[0][2]], [B[1], A[1][1], A[1][2]], [B[2], A[2][1], A[2][2]]]) / D
    b = det3([[A[0][0], B[0], A[0][2]], [A[1][0], B[1], A[1][2]], [A[2][0], B[2], A[2][2]]]) / D

    # (a, b) points towards increasing luminance (the light end). The
    # gradient runs light -> dark, so it starts at the max projection.
    norm = math.hypot(a, b)
    ux, uy = a / norm, b / norm
    proj = [p[0] * ux + p[1] * uy for p in poly]
    cx = sum(p[0] for p in poly) / len(poly)
    cy = sum(p[1] for p in poly) / len(poly)
    c0 = cx * ux + cy * uy
    hi, lo = max(proj) - c0, min(proj) - c0
    return {
        "x1": round(cx + ux * hi, 3),
        "y1": round(cy + uy * hi, 3),
        "x2": round(cx + ux * lo, 3),
        "y2": round(cy + uy * lo, 3),
    }


def main() -> None:
    tree = ET.parse(SRC)
    root = tree.getroot()
    vb = [float(v) for v in root.get("viewBox", "").split()]

    clips: dict[str, list[Point]] = {}
    for cp in root.iter(f"{SVG_NS}clipPath"):
        path = cp.find(f"{SVG_NS}path")
        assert path is not None
        m = parse_matrix(path.get("transform"))
        clips[cp.get("id", "")] = [apply(m, p) for p in parse_path(path.get("d", ""))]

    faces = []
    for path in root.iter(f"{SVG_NS}path"):
        if path.get("fill") is None:
            continue  # clipPath geometry
        m = parse_matrix(path.get("transform"))
        pts = [apply(m, p) for p in parse_path(path.get("d", ""))]
        faces.append({"name": FACE_NAMES[len(faces)], "points": pts})

    pieces = []
    for g in root.iter(f"{SVG_NS}g"):
        ref = g.get("clip-path", "")
        mm = re.fullmatch(r"url\(#(clip_\d+)\)", ref)
        image = g.find(f"{SVG_NS}image")
        if not mm or image is None:
            continue
        poly = clips[mm.group(1)]
        pieces.append({"points": poly, "gradient": gradient_for(image, poly)})

    def fmt_pts(pts: list[Point]) -> str:
        return "[" + ", ".join(f"[{x:.3f}, {y:.3f}]" for x, y in pts) + "]"

    lines = [
        "// GENERATED by assets-pipeline/scripts/logo/extract_mark_geometry.py",
        "// from public/brand/yuei-mark.svg — do not edit by hand.",
        "",
        "export type Point = readonly [number, number];",
        "",
        "export type MarkPiece = {",
        "  /** Clip polygon in viewBox space. */",
        "  points: readonly Point[];",
        "  /** Gradient vector in viewBox space, from the light (sky) end to the dark (navy) end. */",
        "  gradient: { x1: number; y1: number; x2: number; y2: number };",
        "};",
        "",
        "export type PillarFace = { name: \"left\" | \"right\" | \"top\"; points: readonly Point[] };",
        "",
        f"export const MARK_VIEWBOX = {{ x: {vb[0]}, y: {vb[1]}, width: {vb[2]}, height: {vb[3]} }} as const;",
        "",
        "/** The six flying pieces, in document order (left chain bottom->top, then right chain bottom->top). */",
        "export const MARK_PIECES: readonly MarkPiece[] = [",
    ]
    for p in pieces:
        lines.append(
            f"  {{ points: {fmt_pts(p['points'])}, gradient: {json.dumps(p['gradient']).replace('\"', '')} }},"
        )
    lines += ["];", "", "export const PILLAR_FACES: readonly PillarFace[] = ["]
    for f in faces:
        lines.append(f"  {{ name: \"{f['name']}\", points: {fmt_pts(f['points'])} }},")
    lines += ["];", ""]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(pieces)} pieces, {len(faces)} faces")


if __name__ == "__main__":
    main()
