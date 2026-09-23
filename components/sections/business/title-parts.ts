import { TITLE_BREAK } from "@/lib/content/title-break";

/**
 * Line-break units of a big title. Render each part as an `inline-block`
 * (with `break-keep`) so lines break only between parts — Safari has no
 * `word-break: auto-phrase`, so Japanese would otherwise break mid-word.
 *
 * - `display` (content `titleDisplay`, e.g. "ナイト|エンターテインメント|事業")
 *   gives the parts explicitly; it is used only when it spells `title`.
 * - Otherwise: after "・", else before a trailing "事業", else the whole title.
 */
export function titleParts(title: string, display?: string): string[] {
  if (display !== undefined) {
    const parts = display.split(TITLE_BREAK).filter(Boolean);
    if (parts.length > 0 && parts.join("") === title) return parts;
  }
  const parts = title.split(/(?<=・)/u).filter(Boolean);
  return parts.length > 1 ? parts : title.split(/(?=事業$)/u).filter(Boolean);
}
