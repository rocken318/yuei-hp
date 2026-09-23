import { describe, it, expect, vi } from "vitest";

// Motion batches computed-value updates on its frame loop, which is driven by
// requestAnimationFrame (absent in node). Provide one before motion loads.
vi.hoisted(() => {
  globalThis.requestAnimationFrame ??= (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16) as unknown as number;
});

import { motionValue, transformValue } from "motion/react";
import { gate } from "@/lib/effects/hooks";

// transformValue is what useTransform(fn) builds on: it subscribes to the
// motion values read during its first run.
const nextFrame = () => new Promise((r) => setTimeout(r, 50));

describe("gate (useGated)", () => {
  it("静止中は rest、active が 1 になると source に追従する", async () => {
    const source = motionValue(0.2);
    const active = motionValue(0);
    const gated = transformValue(gate(source, active, 1));
    expect(gated.get()).toBe(1);

    active.set(1);
    await nextFrame();
    expect(gated.get()).toBe(0.2);

    // The source changes AFTER active flipped: still tracked.
    source.set(0.7);
    await nextFrame();
    expect(gated.get()).toBe(0.7);

    active.set(0);
    await nextFrame();
    expect(gated.get()).toBe(1);
  });

  it("関数ソースでも中の motion value に追従する", async () => {
    const a = motionValue(1);
    const b = motionValue(2);
    const active = motionValue(0);
    const gated = transformValue(gate(() => a.get() + b.get(), active, 0));
    expect(gated.get()).toBe(0);
    active.set(1);
    await nextFrame();
    expect(gated.get()).toBe(3);
    b.set(5);
    await nextFrame();
    expect(gated.get()).toBe(6);
  });
});
