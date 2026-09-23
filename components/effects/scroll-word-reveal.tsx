// Source: https://21st.dev/@motiondotdev/components/motion-scroll-word-reveal
"use client";

import { useRef, type RefObject } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
  type UseScrollOptions,
} from "motion/react";
import { cn } from "@/lib/utils";
import { useMotionActive } from "@/lib/effects/hooks";
import {
  getWordOpacity,
  getWordRange,
  REST_OPACITY,
  REVEAL_SPAN,
  segmentJa,
  WORD_WINDOW,
} from "@/lib/effects/word-reveal";

export type ScrollWordRevealProps = {
  /** Full text. Lines separated by "\n" render as block lines. */
  text: string;
  /**
   * Preferred: 0→1 progress driven by the caller (e.g. the scrollYProgress of
   * a pinned section). The component itself creates no sticky layout.
   */
  progress?: MotionValue<number>;
  /** Fallback when no `progress`: track this element in window scroll. */
  target?: RefObject<HTMLElement | null>;
  /** useScroll offset for the fallback (default: while own/target box crosses the viewport). */
  offset?: UseScrollOptions["offset"];
  as?: "p" | "h2" | "h3" | "div";
  className?: string;
  lineClassName?: string;
  wordClassName?: string;
  /** Opacity of not-yet-revealed words. */
  restOpacity?: number;
  /** Share of progress over which word starts are spread (default 0.8). */
  span?: number;
  /** Progress length for one word to fade in (default 0.2). */
  wordWindow?: number;
};

type WordProps = {
  children: string;
  progress: MotionValue<number>;
  active: MotionValue<number>;
  range: { start: number; end: number };
  rest: number;
  className?: string;
};

function Word({ children, progress, active, range, rest, className }: WordProps) {
  const opacity = useTransform(() =>
    active.get() ? getWordOpacity(progress.get(), range, rest) : 1,
  );
  return (
    <motion.span aria-hidden="true" className={className} style={{ opacity }}>
      {children}
    </motion.span>
  );
}

/**
 * Words (Japanese: bunsetsu-like segments) go from dim to solid as progress
 * advances. SSR / reduced motion render the text fully opaque.
 */
export function ScrollWordReveal({
  text,
  progress,
  target,
  offset = ["start 0.85", "end 0.35"],
  as = "p",
  className,
  lineClassName,
  wordClassName,
  restOpacity = REST_OPACITY,
  span = REVEAL_SPAN,
  wordWindow = WORD_WINDOW,
}: ScrollWordRevealProps) {
  const ownRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: target ?? ownRef, offset });
  const value = progress ?? scrollYProgress;
  const active = useMotionActive();

  const lines = text.split("\n").map((line) => segmentJa(line));
  const offsets = lines.map((_, li) =>
    lines.slice(0, li).reduce((n, words) => n + words.length, 0),
  );
  const count = lines.reduce((n, words) => n + words.length, 0);

  const Component = motion[as];
  return (
    <Component ref={ownRef as RefObject<never>} className={className}>
      <span className="sr-only">{text}</span>
      {lines.map((words, li) => (
        <span key={li} aria-hidden="true" className={cn("block", lineClassName)}>
          {words.map((word, wi) => {
            const i = offsets[li] + wi;
            return (
              <Word
                key={i}
                progress={value}
                active={active}
                range={getWordRange(i, count, span, wordWindow)}
                rest={restOpacity}
                className={wordClassName}
              >
                {word}
              </Word>
            );
          })}
        </span>
      ))}
    </Component>
  );
}

export default ScrollWordReveal;
