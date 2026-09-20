import type { JSONContent } from "@tiptap/core";
import type { IntroBlock } from "@/entities/project/api/story-api";

const unsupported = () =>
  new Error(
    "현재 서식은 서버에서 보존할 수 없습니다. 일반 텍스트·이미지·영상만 저장할 수 있습니다.",
  );
function mediaUrl(value: unknown) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value))
    throw new Error("업로드가 완료된 이미지·영상 URL만 저장할 수 있습니다.");
  return value;
}
export function toIntroContent(document: JSONContent): IntroBlock[] {
  const blocks: IntroBlock[] = [];
  const add = (node: JSONContent) => {
    if (node.marks?.length) throw unsupported();
    if (node.type === "paragraph") {
      if ((node.content?.filter((child) => child.type === "image").length ?? 0) > 1)
        throw unsupported();
      if (node.attrs?.textAlign && node.attrs.textAlign !== "left") throw unsupported();
      let value = "";
      const flush = () => {
        if (value) blocks.push({ type: "TEXT", value });
        value = "";
      };
      for (const child of node.content ?? []) {
        if (child.marks?.length) throw unsupported();
        if (child.type === "text") value += child.text ?? "";
        else if (child.type === "hardBreak") value += "\n";
        else if (child.type === "image") {
          if (value) throw unsupported();
          add(child);
        } else throw unsupported();
      }
      if (value && node.content?.some((child) => child.type === "image")) throw unsupported();
      if (value.trim()) flush();
    } else if (node.type === "image") {
      if (node.attrs?.alt || node.attrs?.title) throw unsupported();
      blocks.push({ type: "IMAGE", value: mediaUrl(node.attrs?.src) });
    } else if (node.type === "video" || node.type === "youtube") {
      blocks.push({ type: "VIDEO_URL", value: mediaUrl(node.attrs?.src) });
    } else throw unsupported();
  };
  for (const [index, node] of (document.content ?? []).entries()) {
    if (
      node.type === "paragraph" &&
      !node.content?.length &&
      index < (document.content?.length ?? 0) - 1
    )
      throw unsupported();
    add(node);
  }
  return blocks;
}
export function fromIntroContent(blocks: IntroBlock[]): JSONContent {
  return {
    type: "doc",
    content: blocks.length
      ? blocks.map((block) => {
          if (block.type === "TEXT")
            return {
              type: "paragraph",
              content: block.value
                .split("\n")
                .flatMap((text, index) => [
                  ...(index ? [{ type: "hardBreak" }] : []),
                  ...(text ? [{ type: "text", text }] : []),
                ]),
            };
          if (block.type === "IMAGE")
            return {
              type: "paragraph",
              content: [{ type: "image", attrs: { src: mediaUrl(block.value) } }],
            };
          if (block.type === "VIDEO_URL")
            return {
              type: /^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//i.test(block.value)
                ? "youtube"
                : "video",
              attrs: { src: mediaUrl(block.value) },
            };
          throw unsupported();
        })
      : [{ type: "paragraph" }],
  };
}
