/**
 * A Google Fonts subset holding just the glyphs of `text`, as TrueType (the
 * CSS API serves TTF to clients without a browser user agent; next/og can't
 * read WOFF2). Fetched when the share image is generated (at build).
 */
export async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const src = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1];
  if (!src) throw new Error(`No TrueType source for ${family} ${weight}`);
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Font download failed (${res.status}) for ${family} ${weight}`);
  return res.arrayBuffer();
}
