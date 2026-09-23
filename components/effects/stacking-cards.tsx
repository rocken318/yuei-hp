// Source: https://21st.dev/@danielpetho/components/stacking-cards
// author: Khoa Phan <https://www.pldkhoa.dev>
// Adapted: window scroll only (no container), reduced-motion keeps cards unscaled.

"use client";

import {
  createContext,
  useContext,
  useRef,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
  type UseScrollOptions,
} from "motion/react";

import { cn } from "@/lib/utils";
import { useMotionActive } from "@/lib/effects/hooks";

export interface StackingCardsProps
  extends PropsWithChildren,
    HTMLAttributes<HTMLDivElement> {
  /** Extra useScroll options (target is always this element; window scroll). */
  scrollOptions?: Omit<UseScrollOptions, "container" | "target">;
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
  scrollOptions,
  scaleMultiplier,
  totalCards,
  ...props
}: StackingCardsProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    offset: ["start start", "end end"],
    ...scrollOptions,
    target: targetRef,
  });
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
  const scaleTo = 1 - (totalCards - index) * (scaleMultiplier ?? 0.03);
  const rangeScale = [index * (1 / totalCards), 1];
  const scrollScale = useTransform(progress, rangeScale, [1, scaleTo]);
  // Read both before branching: useTransform(fn) subscribes only to values read
  // during its first (render-time) run, when active is still 0.
  const scale = useTransform(() => {
    const s = scrollScale.get();
    return active.get() ? s : 1;
  });
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
