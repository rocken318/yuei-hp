/** Pure helpers for the news pages (app/news, components/page/news-list). */

/** "2026-09-24" → "2026.09.24" (display form; <time dateTime> keeps the ISO day). */
export function formatNewsDate(date: string): string {
  return date.replaceAll("-", ".");
}

/**
 * The neighbours of `slug` in a newest-first list: `newer` is the next more
 * recent item, `older` the next older one. Missing ends are undefined.
 */
export function adjacentNews<T extends { slug: string }>(
  items: readonly T[],
  slug: string,
): { newer: T | undefined; older: T | undefined } {
  const i = items.findIndex((n) => n.slug === slug);
  if (i < 0) return { newer: undefined, older: undefined };
  return { newer: items[i - 1], older: items[i + 1] };
}
