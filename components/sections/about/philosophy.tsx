import { segmentLines } from "@/lib/effects/word-reveal";
import { philosophyBody } from "@/lib/page/about";
import { PhilosophyStage } from "./philosophy-stage";

type Props = { philosophy: { title: string; body: string } };

/**
 * 企業理念 (server part). The body lines are segmented here, on the server,
 * so the client never runs Intl.Segmenter while rendering (see
 * components/sections/home/message.tsx).
 */
export function Philosophy({ philosophy }: Props) {
  const body = philosophyBody(philosophy);
  return <PhilosophyStage title={philosophy.title} segments={body ? segmentLines(body) : []} />;
}
