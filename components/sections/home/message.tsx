import { segmentLines } from "@/lib/effects/word-reveal";
import { MessageStage } from "./message-stage";

const MESSAGE = [
  "国分町の夜から、街の未来へ。",
  "人が集い、語らい、笑顔になる場所を。",
  "飲食、エンターテインメント、デジタルサイネージ、そしてWeb。",
  "私たちは領域を越えて、この街に新しい価値を届けます。",
].join("\n");

/**
 * Company message (server part). The message is segmented here, on the
 * server, so the client never runs Intl.Segmenter while rendering (its
 * dictionaries differ between engines → hydration mismatches).
 */
export function Message() {
  return <MessageStage segments={segmentLines(MESSAGE)} />;
}

export default Message;
