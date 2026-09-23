/**
 * Preferred line-break points for a business name: after "・", else before a
 * trailing "事業" (same rule as the home business cards). Render each part as
 * an inline-block so lines break only between parts.
 */
export function titleParts(title: string): string[] {
  const parts = title.split(/(?<=・)/u);
  return parts.length > 1 ? parts : title.split(/(?=事業$)/u);
}
