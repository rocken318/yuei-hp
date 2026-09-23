import type { ReactNode } from "react";

export type InfoRow = { label: string; value?: ReactNode };

/**
 * True when an info-table value has something to show. Missing facts stay
 * blank (AGENTS.md: never guess), so null/undefined/booleans, empty or
 * whitespace-only strings and empty arrays all count as "no value".
 */
export function hasInfoValue(value: ReactNode): boolean {
  if (value === null || value === undefined || typeof value === "boolean") return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasInfoValue);
  return true;
}

/** The rows that have a value to show, in order. */
export function visibleInfoRows<T extends InfoRow>(rows: readonly T[]): T[] {
  return rows.filter((row) => hasInfoValue(row.value));
}
