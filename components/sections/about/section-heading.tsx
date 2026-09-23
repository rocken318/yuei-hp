import type { ReactNode } from "react";
import { SectionEyebrow } from "@/components/sections/home/section-eyebrow";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  /** Latin label (e.g. "PHILOSOPHY"). */
  eyebrow: string;
  children: ReactNode;
  tone?: "default" | "onDark";
  className?: string;
};

/** Eyebrow + h2 used by every /about section. */
export function SectionHeading({ id, eyebrow, children, tone = "default", className }: Props) {
  return (
    <div className={className}>
      <SectionEyebrow tone={tone}>{eyebrow}</SectionEyebrow>
      <h2
        id={id}
        className={cn(
          "mt-4 text-2xl font-bold tracking-[0.04em] md:mt-5 md:text-4xl",
          tone === "onDark" ? "text-surface" : "text-ink",
        )}
      >
        {children}
      </h2>
    </div>
  );
}
