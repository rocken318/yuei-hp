/**
 * A big title as unbreakable units (see titleParts): each part is an
 * inline-block, so lines break only between parts. Pair with `break-keep`
 * on the heading so a part never breaks mid-word (Safari lacks
 * `word-break: auto-phrase`).
 */
export function TitleLines({ parts }: { parts: readonly string[] }) {
  return parts.map((part, i) => (
    <span key={i} className="inline-block">
      {part}
    </span>
  ));
}
