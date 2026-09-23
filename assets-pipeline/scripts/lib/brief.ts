import { z } from "zod";
import { createHash } from "node:crypto";

export const BriefSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  purpose: z.string().min(1),
  page: z.string().min(1),
  aspect: z.string().regex(/^\d+:\d+$/),
  size: z.string().regex(/^\d+x\d+$/),
  prompt: z.string().min(1),
  negative: z.array(z.string()).default([]),
  variants: z.number().int().min(1).max(6).default(3),
});
export type Brief = z.infer<typeof BriefSchema>;

export const StyleSchema = z.object({
  description: z.string().min(1),
  negative: z.array(z.string()).default([]),
});
export type Style = z.infer<typeof StyleSchema>;

export type ManifestEntry = { id: string; variant: string; output: string; briefHash: string; adoptedAt: string };

export function composePrompt(brief: Brief, style: Style, outDir: string): string {
  const files = Array.from({ length: brief.variants }, (_, i) => `${outDir}/v${i + 1}.png`);
  const negative = [...style.negative, ...brief.negative].join(", ");
  return [
    `Use your image generation tool to create ${brief.variants} distinct variations of one image.`,
    `Purpose: ${brief.purpose} (page ${brief.page}).`,
    `Subject: ${brief.prompt}`,
    `Shared art direction: ${style.description}`,
    `Aspect ratio ${brief.aspect}, target size ${brief.size}.`,
    `Avoid: ${negative}.`,
    `Save the results as PNG files at exactly these paths (create the folder if needed):`,
    ...files.map((f) => `- ${f}`),
    `Do not create, modify or delete any other file in the repository. When finished, reply with the list of saved paths.`,
  ].join("\n");
}

/**
 * Arguments for `codex exec`. The prompt itself is NOT an argument: it is
 * passed on stdin (the trailing "-"), because multi-line prompts do not
 * survive Windows shell quoting when spawning the `codex.cmd` shim.
 */
export function buildCodexArgs(repoRoot: string, lastMessageFile: string): string[] {
  return ["exec", "-C", repoRoot, "-s", "workspace-write", "--enable", "image_generation", "-o", lastMessageFile, "-"];
}

export function briefHash(brief: Brief): string {
  return createHash("sha256").update(JSON.stringify(brief)).digest("hex");
}

export function recordAdoption(manifest: ManifestEntry[], brief: Brief, variant: string, output: string, adoptedAt: string): ManifestEntry[] {
  const entry: ManifestEntry = { id: brief.id, variant, output, briefHash: briefHash(brief), adoptedAt };
  return [...manifest.filter((m) => m.id !== brief.id), entry];
}
