import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Marks draft copy on preview/local builds. Drafts are not rendered at all in
 * production (see lib/draft.ts), so this badge never ships there.
 */
export function DraftBadge({ className }: { className?: string }) {
  return (
    <span
      data-testid="draft-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-brand-blue/50 bg-brand-sky/25 px-3 py-1 text-xs font-bold text-brand-blue",
        className,
      )}
    >
      <PenLine aria-hidden className="size-3.5" />
      下書き（公開前に確認）
    </span>
  );
}
