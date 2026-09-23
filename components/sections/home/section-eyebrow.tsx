import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  /** "onDark" for navy sections (sky text and rule). */
  tone?: "default" | "onDark";
  className?: string;
};

/** Small latin label above a section heading, led by a short rule. */
export function SectionEyebrow({ children, tone = "default", className }: Props) {
  const dark = tone === "onDark";
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-display text-xs tracking-[0.3em]",
        dark ? "text-brand-sky" : "text-brand-blue",
        className,
      )}
    >
      <span aria-hidden className={cn("h-px w-8", dark ? "bg-brand-sky/60" : "bg-brand-blue/60")} />
      {children}
    </p>
  );
}
