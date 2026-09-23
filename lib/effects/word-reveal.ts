/**
 * Pure helpers for components/effects/scroll-word-reveal.tsx.
 * Ported from https://21st.dev/@motiondotdev/components/motion-scroll-word-reveal
 * (getWordRange / getWordOpacity), plus Japanese segmentation.
 */

/** Unrevealed words stay readable (dim, not ghosted) over the message veil. */
export const REST_OPACITY = 0.3;
/** Portion of the progress range over which word start points are spread. */
export const REVEAL_SPAN = 0.8;
/** Progress length it takes one word to go from rest to full opacity. */
export const WORD_WINDOW = 0.2;

export type WordRange = { start: number; end: number };

export function getWordRange(
  index: number,
  count: number,
  span = REVEAL_SPAN,
  window = WORD_WINDOW,
): WordRange {
  const start = count <= 1 ? 0 : (index / (count - 1)) * span;
  return { start, end: Math.min(1, start + window) };
}

export function getWordOpacity(
  progress: number,
  { start, end }: WordRange,
  rest = REST_OPACITY,
): number {
  if (progress <= start) return rest;
  if (progress >= end) return 1;
  const t = (progress - start) / (end - start);
  return rest + (1 - rest) * t;
}

const OPENING = /^[「『（(［\[【〈《"'“‘]+$/u;
const HIRAGANA = /^[\p{Script=Hiragana}ー]+$/u;
const KATAKANA_CHAR = /[\p{Script=Katakana}ー]/u;
const HAN_CHAR = /\p{Script=Han}/u;
const TRAILING_BREAK = /[\s、。，．,.!?！？」』）)］\]】〉》"'”’]$/u;

type Piece = { text: string; wordLike: boolean };

function segmentRaw(text: string): Piece[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("ja", { granularity: "word" });
    return Array.from(segmenter.segment(text), (s) => ({
      text: s.segment,
      wordLike: s.isWordLike ?? false,
    }));
  }
  // Fallback: split on whitespace, keeping it.
  return text
    .split(/(\s+)/u)
    .filter(Boolean)
    .map((t) => ({ text: t, wordLike: !/^\s+$/u.test(t) }));
}

/**
 * Should a word-like piece be glued onto the previous segment so the result
 * reads like a 文節 (e.g. 国分+町, 未来+へ, サイ+ネ+ージ)?
 */
function continuesPrevious(prev: string, piece: string): boolean {
  if (TRAILING_BREAK.test(prev)) return false;
  const last = prev.slice(-1);
  const first = piece[0];
  if (HIRAGANA.test(piece)) return true; // particles, okurigana
  if (KATAKANA_CHAR.test(last) && KATAKANA_CHAR.test(first)) return true;
  if (HAN_CHAR.test(last) && HAN_CHAR.test(first)) return true;
  return false;
}

/**
 * Split (Japanese) text into bunsetsu-like segments for word-by-word reveals.
 * - `segments.join("") === text` always holds (whitespace preserved).
 * - Punctuation and whitespace attach to the preceding segment; opening
 *   brackets attach to the following one. No empty segments.
 */
export function segmentJa(text: string): string[] {
  const out: string[] = [];
  let pendingPrefix = "";

  for (const { text: piece, wordLike } of segmentRaw(text)) {
    if (!wordLike) {
      if (OPENING.test(piece)) {
        pendingPrefix += piece;
      } else if (out.length > 0 && !pendingPrefix) {
        out[out.length - 1] += piece;
      } else {
        pendingPrefix += piece;
      }
      continue;
    }
    if (!pendingPrefix && out.length > 0 && continuesPrevious(out[out.length - 1], piece)) {
      out[out.length - 1] += piece;
    } else {
      out.push(pendingPrefix + piece);
      pendingPrefix = "";
    }
  }

  if (pendingPrefix) {
    if (out.length > 0) out[out.length - 1] += pendingPrefix;
    else out.push(pendingPrefix);
  }
  return out;
}

/**
 * Lines ("\n"-separated) → segments, for ScrollWordReveal's `segments` prop.
 * Call this on the server: Intl.Segmenter's dictionaries differ between
 * engines, so segmenting during client render could mismatch hydration.
 */
export function segmentLines(text: string): string[][] {
  return text.split("\n").map((line) => segmentJa(line));
}
