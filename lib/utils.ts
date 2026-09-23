export { cn } from "cn"

/** Two-digit ordinal label: 1 → "01". */
export const pad2 = (n: number) => String(n).padStart(2, "0")
