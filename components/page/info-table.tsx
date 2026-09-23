import { visibleInfoRows, type InfoRow } from "@/lib/page/info-rows";
import { cn } from "@/lib/utils";

export type { InfoRow };

type Props = { rows: InfoRow[]; className?: string };

/**
 * Label/value table (definition list). Only rows with a value are rendered
 * (facts we don't have yet stay out rather than showing "—"); with no such
 * rows nothing is rendered at all. Stacks on phones, two columns from md.
 */
export function InfoTable({ rows, className }: Props) {
  const visible = visibleInfoRows(rows);
  if (visible.length === 0) return null;
  return (
    <dl data-testid="info-table" className={cn("border-t border-line", className)}>
      {visible.map((row) => (
        <div
          key={row.label}
          className="grid gap-1.5 border-b border-line py-5 md:grid-cols-[12rem_minmax(0,1fr)] md:items-baseline md:gap-8 md:py-6"
        >
          <dt className="text-xs font-bold tracking-[0.1em] text-brand-blue md:text-sm">{row.label}</dt>
          <dd className="text-sm leading-[1.9] text-ink [word-break:auto-phrase] md:text-base">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
