// Source: https://21st.dev/@danielpetho/components/stacking-cards
// author: Khoa Phan <https://www.pldkhoa.dev>
// Adapted: window scroll only (no container), reduced-motion keeps cards unscaled,
// the last card never scales down, progress measured against the small viewport
// (useStableScroll) so the stack doesn't jump when the iOS toolbar reappears.

"use client";

import {
  createContext,
  useContext,
  useRef,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";
import { motion, useTransform, type MotionValue } from "motion/react";

import { cn } from "@/lib/utils";
import { useGated, useMotionActive } from "@/lib/effects/hooks";
import { useStableScroll, type StableScrollOffset } from "@/lib/effects/stable-scroll";

export interface StackingCardsProps
  extends PropsWithChildren,
    HTMLAttributes<HTMLDivElement> {
  /** Scroll offset of this element (window scroll). Default: pinned span, ["start start", "end end"]. */
  offset?: StableScrollOffset;
  scaleMultiplier?: number;
  totalCards: number;
}

export interface StackingCardItemProps
  extends HTMLAttributes<HTMLDivElement>,
    PropsWithChildren {
  index: number;
  topPosition?: string;
}

const StackingCardsContext = createContext<{
  progress: MotionValue<number>;
  active: MotionValue<number>;
  scaleMultiplier?: number;
  totalCards?: number;
} | null>(null);

export function useStackingCardsContext() {
  const context = useContext(StackingCardsContext);
  if (!context) throw new Error("StackingCardItem must be used within StackingCards");
  return context;
}

export default function StackingCards({
  children,
  className,
  offset = ["start start", "end end"],
  scaleMultiplier,
  totalCards,
  ...props
}: StackingCardsProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const scrollYProgress = useStableScroll(targetRef, offset);
  const active = useMotionActive();

  return (
    <StackingCardsContext.Provider
      value={{ progress: scrollYProgress, active, scaleMultiplier, totalCards }}
    >
      <div className={cn(className)} ref={targetRef} {...props}>
        {children}
      </div>
    </StackingCardsContext.Provider>
  );
}

export function StackingCardItem({
  index,
  topPosition,
  className,
  children,
  ...props
}: StackingCardItemProps) {
  const { progress, active, scaleMultiplier, totalCards = 0 } = useStackingCardsContext();
  // The last card stays full size: nothing stacks on top of it.
  const isLast = index >= totalCards - 1;
  const scaleTo = isLast ? 1 : 1 - (totalCards - index) * (scaleMultiplier ?? 0.03);
  const rangeScale = [index * (1 / totalCards), 1];
  const scrollScale = useTransform(progress, rangeScale, [1, scaleTo]);
  const scale = useGated(scrollScale, active, 1);
  const top = topPosition ?? `${5 + index * 3}%`;

  return (
    <div className={cn("sticky top-0 h-full", className)} {...props}>
      <motion.div className="relative h-full origin-top" style={{ top, scale }}>
        {children}
      </motion.div>
    </div>
  );
}

export { StackingCards };
