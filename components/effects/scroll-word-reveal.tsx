// Source: https://21st.dev/@motiondotdev/components/motion-scroll-word-reveal
"use client";

import { useRef, type RefObject } from "react";
import { motion, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";
import { useGated, useMotionActive } from "@/lib/effects/hooks";
import { useStableScroll, type StableScrollOffset } from "@/lib/effects/stable-scroll";
import {
  getWordOpacity,
  getWordRange,
  REST_OPACITY,
  REVEAL_SPAN,
  WORD_WINDOW,
} from "@/lib/effects/word-reveal";

type BaseProps = {
  /**
   * Pre-segmented text: lines → segments. Build it on the server with
   * `segmentLines()` from lib/effects/word-reveal (Intl.Segmenter output
   * differs between engines, so segmenting while rendering on the client
   * could break hydration).
   */
  segments: string[][];
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

export type ScrollWordRevealProps = BaseProps & {
  /**
   * Preferred: 0→1 progress driven by the caller (e.g. the scrollYProgress of
   * a pinned section). The component itself creates no sticky layout.
   */
  progress?: MotionValue<number>;
  /** Fallback when no `progress`: track this element in window scroll. */
  target?: RefObject<HTMLElement | null>;
  /** useScroll offset for the fallback (default: while own/target box crosses the viewport). */
  offset?: StableScrollOffset;
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
  const opacity = useGated(() => getWordOpacity(progress.get(), range, rest), active, 1);
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
export function ScrollWordReveal({ progress, target, offset, ...rest }: ScrollWordRevealProps) {
  return progress ? (
    <WordReveal {...rest} progress={progress} />
  ) : (
    <TrackedWordReveal {...rest} target={target} offset={offset} />
  );
}

/** Fallback: progress from this element's (or `target`'s) pass through the viewport. */
function TrackedWordReveal({
  target,
  offset = ["start 0.85", "end 0.35"],
  ...rest
}: BaseProps & Pick<ScrollWordRevealProps, "target" | "offset">) {
  const ownRef = useRef<HTMLElement>(null);
  const scrollYProgress = useStableScroll(target ?? ownRef, offset);
  return <WordReveal {...rest} progress={scrollYProgress} ownRef={ownRef} />;
}

function WordReveal({
  segments,
  progress,
  ownRef,
  as = "p",
  className,
  lineClassName,
  wordClassName,
  restOpacity = REST_OPACITY,
  span = REVEAL_SPAN,
  wordWindow = WORD_WINDOW,
}: BaseProps & { progress: MotionValue<number>; ownRef?: RefObject<HTMLElement | null> }) {
  const active = useMotionActive();
  const text = segments.map((line) => line.join("")).join("\n");
  const offsets = segments.map((_, li) =>
    segments.slice(0, li).reduce((n, words) => n + words.length, 0),
  );
  const count = segments.reduce((n, words) => n + words.length, 0);

  const Component = motion[as];
  return (
    <Component ref={ownRef as RefObject<never>} className={className}>
      <span className="sr-only">{text}</span>
      {segments.map((words, li) => (
        <span key={li} aria-hidden="true" className={cn("block", lineClassName)}>
          {words.map((word, wi) => {
            const i = offsets[li] + wi;
            return (
              <Word
                key={i}
                progress={progress}
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
