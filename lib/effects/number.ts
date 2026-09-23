const formatter = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });

/** Round to an integer and add thousands separators ("1,234"). */
export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  return formatter.format(rounded === 0 ? 0 : rounded);
}
