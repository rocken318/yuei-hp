"""飲食事業のヒーロー画像: 実写3枚を斜めパネルで組み合わせる（写真の内容は加工しない）。

使い方: python assets-pipeline/scripts/composite/dining_hero.py
入力:   images/ 以下の原本（Git 管理外）
出力:   public/images/source/dining/hero-composite.webp
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "images"
OUT = ROOT / "public/images/source/dining/hero-composite.webp"

W, H = 2400, 1350
SLANT = 160   # パネル境界の傾き（上端と下端の x の差）
GAP = 16      # パネル間の白い隙間

# 暖家は肖像ポスターとテレビ画面を含まない範囲だけを使う。
# (原本, 切り出し範囲 left, top, right, bottom, 構図の中心 (x, y) 0〜1)。
PANELS = [
    ("En/S__35217445_0.jpg", (450, 0, 1180, 970), (0.5, 0.5)),                 # 焼肉En 外観（看板と暖簾）
    ("En/2024_08_22_焼肉えん/202408220007.JPG", (1200, 300, 4500, 3900), (0.45, 0.5)),  # 焼肉En 個室（竹とテーブル）
    ("暖家/IMG_1896.jpg", (1810, 1350, 3024, 3310), (0.5, 0.5)),                # 暖家 店内（木の壁とテーブル席）
]
# パネル境界（上端、キャンバス幅に対する比率）。外観の看板と暖簾が入るよう左を広くとる。
SPLITS = [0.4, 0.72]


def cover(img: Image.Image, w: int, h: int, centering: tuple[float, float]) -> Image.Image:
    return ImageOps.fit(img, (w, h), method=Image.LANCZOS, centering=centering)


def main() -> None:
    canvas = Image.new("RGB", (W, H), "white")
    n = len(PANELS)
    # 境界線の x（上端基準）。両端はキャンバス外まで伸ばす。
    edges = [-SLANT] + [round(W * r) for r in SPLITS] + [W + SLANT]
    for i, (rel, box, centering) in enumerate(PANELS):
        photo = ImageOps.exif_transpose(Image.open(SRC / rel)).convert("RGB").crop(box)
        x0_top, x1_top = edges[i], edges[i + 1]
        left = max(0, min(x0_top, x0_top - SLANT))
        right = min(W, max(x1_top, x1_top - SLANT))
        tile = cover(photo, right - left, H, centering)
        mask = Image.new("L", (W, H), 0)
        g = GAP // 2 if 0 < i else 0
        g2 = GAP // 2 if i < n - 1 else 0
        ImageDraw.Draw(mask).polygon(
            [(x0_top + g, 0), (x1_top - g2, 0), (x1_top - SLANT - g2, H), (x0_top - SLANT + g, H)],
            fill=255,
        )
        layer = Image.new("RGB", (W, H), "white")
        layer.paste(tile, (left, 0))
        canvas.paste(layer, (0, 0), mask)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, "WEBP", quality=82)
    print(f"ok: {OUT.relative_to(ROOT)} {W}x{H}")


if __name__ == "__main__":
    main()
