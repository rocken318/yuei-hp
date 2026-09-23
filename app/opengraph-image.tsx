import { ImageResponse } from "next/og";
import { BRAND_COLORS as C } from "@/lib/brand/colors";
import { markDataUri } from "@/lib/brand/mark-svg";
import { loadGoogleFont } from "@/lib/og/google-font";
import { OG_IMAGE_ALT } from "@/lib/seo/metadata";

export const alt = OG_IMAGE_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAME = "遊栄Japan株式会社";
const NAME_EN = "YUEI JAPAN Inc.";
const TAGLINE = "「国分町の夜から、街の未来へ。」";

type Font = { name: string; data: ArrayBuffer; weight: 500 | 700; style: "normal" };

/**
 * Subsets with just these glyphs, fetched once when the image is generated
 * (at build — the route is static). Without network the image still renders,
 * in the built-in Latin font (Japanese glyphs would be missing), so an
 * offline build doesn't fail.
 */
async function loadFonts(): Promise<Font[]> {
  try {
    const [heading, display] = await Promise.all([
      loadGoogleFont("Zen Kaku Gothic New", 700, NAME + TAGLINE),
      loadGoogleFont("Space Grotesk", 500, NAME_EN),
    ]);
    return [
      { name: "Zen Kaku Gothic New", data: heading, weight: 700, style: "normal" },
      { name: "Space Grotesk", data: display, weight: 500, style: "normal" },
    ];
  } catch (err) {
    console.warn(`opengraph-image: web fonts unavailable, using the default font (${String(err)})`);
    return [];
  }
}

const fonts = await loadFonts();
const mark = markDataUri();

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          alignItems: "center",
          background: C.surface,
          // Subtle wash of sky toward the lower right.
          backgroundImage: `linear-gradient(125deg, ${C.surface} 0%, ${C.surface} 48%, ${C.sky}66 100%)`,
          fontFamily: "Zen Kaku Gothic New",
        }}
      >
        {/* Brand gradient rule along the bottom. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 14,
            backgroundImage: `linear-gradient(90deg, ${C.navy}, ${C.blue} 55%, ${C.sky})`,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 72, padding: "0 110px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img> */}
          <img src={mark} width={236} height={274} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, letterSpacing: "0.3em", color: C.blue, fontFamily: "Space Grotesk" }}>
              {NAME_EN}
            </div>
            <div style={{ marginTop: 18, fontSize: 76, fontWeight: 700, color: C.ink, letterSpacing: "0.02em" }}>
              {NAME}
            </div>
            <div style={{ marginTop: 22, width: 120, height: 3, background: C.blue }} />
            <div style={{ marginTop: 30, fontSize: 36, fontWeight: 700, color: C.navy, marginLeft: -18 }}>{TAGLINE}</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
