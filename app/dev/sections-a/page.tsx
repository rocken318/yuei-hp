import type { Metadata } from "next";
import { Message } from "@/components/sections/home/message";

// Temporary preview of home sections (Plan 3). Removed in Task 7.
export const metadata: Metadata = {
  title: "Preview: home sections A",
  robots: { index: false, follow: false },
};

export default async function SectionsAPreview() {
  return (
    <>
      <div className="flex h-svh items-center justify-center bg-surface-muted">
        <p className="font-display text-sm tracking-[0.3em] text-ink-muted">HERO PLACEHOLDER</p>
      </div>
      <div data-shot="message">
        <Message />
      </div>
      <div className="h-svh bg-surface" />
    </>
  );
}
