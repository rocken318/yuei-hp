"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useGated, useMotionActive } from "@/lib/effects/hooks";

type Props = { src: string; alt: string };

/**
 * PageHeader's wide image. While it passes through the viewport the photo
 * settles from a slight push-in (scale 1.1 → 1) and drifts against the
 * scroll. Server/hydration/reduced motion: static at the mid-pass framing.
 * Above the fold on every sub-page: loaded eagerly at high fetch priority
 * (Next 16 docs prefer this over `preload`).
 */
export function PageHeaderImage({ src, alt }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useMotionActive();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const p = useGated(scrollYProgress, active, 0.5);
  const scale = useTransform(p, [0, 1], [1.1, 1]);
  const y = useTransform(p, [0, 1], ["-4%", "4%"]);

  return (
    <div
      ref={ref}
      className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-muted sm:aspect-[16/9] md:aspect-[21/9]"
    >
      <motion.div className="absolute -inset-y-[5%] inset-x-0 will-change-transform" style={{ scale, y }}>
        <Image
          src={src}
          alt={alt}
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 80rem) 76rem, calc(100vw - 2.5rem)"
          className="object-cover"
        />
      </motion.div>
    </div>
  );
}
