/** Pure text helpers shared by the sub-pages. */

const LATIN_END = /[\x21-\x7E]$/u;
const LATIN_START = /^[\x21-\x7E]/u;

/**
 * Plain text (MDX body, JSON string) → paragraphs. Paragraphs are separated
 * by blank lines; the lines inside one paragraph are joined — directly for
 * Japanese, with a space between two Latin words — so a hard-wrapped source
 * reads as one flowing paragraph. Lines are trimmed; empty paragraphs dropped.
 */
export function paragraphs(body: string): string[] {
  return body
    .replace(/\r\n?/gu, "\n")
    .split(/\n\s*\n/u)
    .map((p) =>
      p
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .reduce((acc, line) => (acc && LATIN_END.test(acc) && LATIN_START.test(line) ? `${acc} ${line}` : acc + line), ""),
    )
    .filter(Boolean);
}
