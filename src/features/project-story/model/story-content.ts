import type { JSONContent } from "@tiptap/core";
import type { IntroBlock } from "@/entities/project/api/story-api";

type TextStyle = {
  color?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  fontWeight?: string;
};
export type SafeStoryHtmlNode =
  string | { tag: string; style?: TextStyle; children: SafeStoryHtmlNode[] };

const allowedTags = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "p",
  "br",
  "span",
  "div",
  "ul",
  "ol",
  "li",
]);
const unsupported = () =>
  new Error(
    "현재 서식은 서버에서 보존되지 않습니다. 굵게·기울임·밑줄·색상·정렬·목록과 이미지·영상만 저장할 수 있습니다.",
  );

function mediaUrl(value: unknown) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) {
    throw new Error("업로드가 완료된 이미지·영상 URL만 저장할 수 있습니다.");
  }
  return value;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const decodeEntities = (value: string) =>
  value.replace(/&(?:#(x[\da-f]+|\d+)|amp|lt|gt|quot|nbsp|#39);/gi, (entity, numeric) => {
    if (numeric) {
      const number = Number(numeric.toLowerCase().startsWith("x") ? `0${numeric}` : numeric);
      return Number.isSafeInteger(number) &&
        number <= 0x10ffff &&
        !(number >= 0xd800 && number <= 0xdfff)
        ? String.fromCodePoint(number)
        : entity;
    }
    return (
      { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&nbsp;": "\u00a0", "&#39;": "'" }[
        entity.toLowerCase()
      ] ?? entity
    );
  });

function sanitizeStyle(value: string | undefined, tag: string): TextStyle | undefined {
  if (!value || !["span", "p", "div"].includes(tag)) return undefined;
  const style: TextStyle = {};
  for (const declaration of value.split(";")) {
    const [property, raw] = declaration.split(":", 2);
    const normalized = raw?.trim();
    if (property?.trim() === "color" && /^#[\da-f]{3,6}$/i.test(normalized ?? "")) {
      style.color = normalized;
    }
    if (
      property?.trim() === "text-align" &&
      /^(left|center|right|justify)$/.test(normalized ?? "")
    ) {
      style.textAlign = normalized as TextStyle["textAlign"];
    }
    if (property?.trim() === "font-weight" && /^(bold|normal|[1-9]00)$/.test(normalized ?? "")) {
      style.fontWeight = normalized;
    }
  }
  return Object.keys(style).length ? style : undefined;
}

function parseHtml(html: string): SafeStoryHtmlNode[] {
  const root: { children: SafeStoryHtmlNode[] } = { children: [] };
  const stack: ({ children: SafeStoryHtmlNode[]; tag?: string } & Partial<
    Exclude<SafeStoryHtmlNode, string>
  >)[] = [root];
  const append = (node: SafeStoryHtmlNode) => stack.at(-1)?.children.push(node);
  const tokens = html.match(/<!--[\s\S]*?-->|<[^>]*>|[^<]+/g) ?? [];
  let ignoredDepth = 0;
  for (const token of tokens) {
    if (token.startsWith("<!--")) continue;
    if (token.startsWith("</")) {
      const tag = token.slice(2, -1).trim().toLowerCase();
      if (["script", "style"].includes(tag) && ignoredDepth) ignoredDepth--;
      for (let index = stack.length - 1; index > 0; index--) {
        if (stack[index].tag === tag) {
          stack.length = index;
          break;
        }
      }
      continue;
    }
    if (token.startsWith("<")) {
      const match = /^<\s*([\w-]+)([\s\S]*?)\/?\s*>$/.exec(token);
      if (!match) continue;
      const tag = match[1].toLowerCase();
      if (["script", "style"].includes(tag)) {
        ignoredDepth++;
        continue;
      }
      if (ignoredDepth || !allowedTags.has(tag)) continue;
      const styleMatch = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(match[2]);
      const node: Exclude<SafeStoryHtmlNode, string> = { tag, children: [] };
      const style = sanitizeStyle(styleMatch?.[1] ?? styleMatch?.[2] ?? styleMatch?.[3], tag);
      if (style) node.style = style;
      append(node);
      if (tag !== "br" && !/\/\s*>$/.test(token)) stack.push(node);
      continue;
    }
    if (!ignoredDepth) append(decodeEntities(token));
  }
  return root.children;
}

function markHtml(node: JSONContent, content: string) {
  return (node.marks ?? []).reduceRight((result, mark) => {
    if (mark.type === "bold") return `<strong>${result}</strong>`;
    if (mark.type === "italic") return `<em>${result}</em>`;
    if (mark.type === "underline") return `<u>${result}</u>`;
    if (
      mark.type === "textStyle" &&
      mark.attrs?.color &&
      /^#[\da-f]{3,6}$/i.test(mark.attrs.color)
    ) {
      return `<span style="color: ${mark.attrs.color}">${result}</span>`;
    }
    if (mark.type === "textStyle" && !Object.values(mark.attrs ?? {}).some(Boolean)) return result;
    throw unsupported();
  }, content);
}

function inlineHtml(nodes: JSONContent[] | undefined): string {
  return (nodes ?? [])
    .map((node) => {
      if (node.type === "text") return markHtml(node, escapeHtml(node.text ?? ""));
      if (node.type === "hardBreak") return "<br>";
      throw unsupported();
    })
    .join("");
}

function blockHtml(node: JSONContent): string {
  if (node.type === "paragraph") {
    const align = node.attrs?.textAlign;
    if (align && !["left", "center", "right", "justify"].includes(align)) throw unsupported();
    return `<p${align ? ` style="text-align: ${align}"` : ""}>${inlineHtml(node.content)}</p>`;
  }
  if (node.type === "bulletList" || node.type === "orderedList") {
    const tag = node.type === "bulletList" ? "ul" : "ol";
    return `<${tag}>${(node.content ?? [])
      .map((item) => {
        if (item.type !== "listItem") throw unsupported();
        return `<li>${(item.content ?? []).map(blockHtml).join("")}</li>`;
      })
      .join("")}</${tag}>`;
  }
  throw unsupported();
}

export function toIntroContent(document: JSONContent): IntroBlock[] {
  const blocks: IntroBlock[] = [];
  let html = "";
  const flush = () => {
    if (html) blocks.push({ type: "TEXT", value: html });
    html = "";
  };
  for (const node of document.content ?? []) {
    if (node.type === "image") {
      flush();
      if (node.attrs?.alt || node.attrs?.title) throw unsupported();
      blocks.push({ type: "IMAGE", value: mediaUrl(node.attrs?.src) });
    } else if (node.type === "video" || node.type === "youtube") {
      flush();
      blocks.push({ type: "VIDEO_URL", value: mediaUrl(node.attrs?.src) });
    } else if (node.type === "paragraph" && node.content?.some((child) => child.type === "image")) {
      if (node.content.length !== 1 || node.content[0].type !== "image") throw unsupported();
      flush();
      if (node.content[0].attrs?.alt || node.content[0].attrs?.title) throw unsupported();
      blocks.push({ type: "IMAGE", value: mediaUrl(node.content[0].attrs?.src) });
    } else {
      html += blockHtml(node);
    }
  }
  flush();
  return blocks;
}

type Marks = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontWeight?: string;
};
const withMarks = (text: string, marks: Marks): JSONContent | null => {
  if (!text) return null;
  const outputMarks: { type: string; attrs?: Record<string, string> }[] = [];
  if (marks.bold || marks.fontWeight === "bold" || Number(marks.fontWeight) >= 600)
    outputMarks.push({ type: "bold" });
  if (marks.italic) outputMarks.push({ type: "italic" });
  if (marks.underline) outputMarks.push({ type: "underline" });
  if (marks.color) outputMarks.push({ type: "textStyle", attrs: { color: marks.color } });
  return { type: "text", text, ...(outputMarks.length ? { marks: outputMarks } : {}) };
};

function inlineContent(nodes: SafeStoryHtmlNode[], marks: Marks = {}): JSONContent[] {
  const content: JSONContent[] = [];
  for (const node of nodes) {
    if (typeof node === "string") {
      const text = withMarks(node, marks);
      if (text) content.push(text);
      continue;
    }
    if (node.tag === "br") {
      content.push({ type: "hardBreak" });
      continue;
    }
    const next = {
      ...marks,
      ...(node.tag === "b" || node.tag === "strong" ? { bold: true } : {}),
      ...(node.tag === "i" || node.tag === "em" ? { italic: true } : {}),
      ...(node.tag === "u" ? { underline: true } : {}),
      ...(node.style?.color ? { color: node.style.color } : {}),
      ...(node.style?.fontWeight ? { fontWeight: node.style.fontWeight } : {}),
    };
    content.push(...inlineContent(node.children, next));
  }
  return content;
}

function htmlBlocks(nodes: SafeStoryHtmlNode[], inherited: TextStyle = {}): JSONContent[] {
  const output: JSONContent[] = [];
  let inlineNodes: SafeStoryHtmlNode[] = [];
  const flushInline = () => {
    if (inlineNodes.length)
      output.push({
        type: "paragraph",
        ...(inherited.textAlign ? { attrs: { textAlign: inherited.textAlign } } : {}),
        content: inlineContent(inlineNodes, inherited),
      });
    inlineNodes = [];
  };
  for (const node of nodes) {
    if (typeof node === "string" && !node.trim() && !inlineNodes.length) continue;
    if (
      typeof node === "string" ||
      ["b", "strong", "i", "em", "u", "span", "br"].includes(node.tag)
    ) {
      inlineNodes.push(node);
      continue;
    }
    flushInline();
    if (
      node.tag === "div" &&
      node.children.some(
        (child) => typeof child !== "string" && ["p", "div", "ul", "ol"].includes(child.tag),
      )
    ) {
      output.push(...htmlBlocks(node.children, { ...inherited, ...node.style }));
    } else if (node.tag === "p" || node.tag === "div") {
      const style = { ...inherited, ...node.style };
      output.push({
        type: "paragraph",
        ...(style.textAlign ? { attrs: { textAlign: style.textAlign } } : {}),
        content: inlineContent(node.children, style),
      });
    } else if (node.tag === "ul" || node.tag === "ol") {
      output.push({
        type: node.tag === "ul" ? "bulletList" : "orderedList",
        content: node.children
          .filter(
            (child): child is Exclude<SafeStoryHtmlNode, string> =>
              typeof child !== "string" && child.tag === "li",
          )
          .map((item) => ({
            type: "listItem",
            content: htmlBlocks(item.children, inherited).length
              ? htmlBlocks(item.children, inherited)
              : [{ type: "paragraph" }],
          })),
      });
    } else if (node.tag === "br") {
      output.push({ type: "paragraph", content: [{ type: "hardBreak" }] });
    }
  }
  flushInline();
  return output;
}

export function isStoryHtml(value: string) {
  return /<\/?(?:b|strong|i|em|u|p|br|span|div|ul|ol|li)\b[^>]*>/i.test(value);
}

export function fromIntroContent(blocks: IntroBlock[]): JSONContent {
  const content: JSONContent[] = [];
  for (const block of blocks) {
    if (block.type === "TEXT") {
      const parsed = parseHtml(block.value);
      if (isStoryHtml(block.value)) {
        content.push(...htmlBlocks(parsed));
      } else {
        content.push({
          type: "paragraph",
          content: block.value
            .split("\n")
            .flatMap((text, index) => [
              ...(index ? [{ type: "hardBreak" }] : []),
              ...(text ? [{ type: "text", text }] : []),
            ]),
        });
      }
    } else if (block.type === "IMAGE") {
      content.push({
        type: "paragraph",
        content: [{ type: "image", attrs: { src: mediaUrl(block.value) } }],
      });
    } else if (block.type === "VIDEO_URL") {
      content.push({
        type: /^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//i.test(block.value)
          ? "youtube"
          : "video",
        attrs: { src: mediaUrl(block.value) },
      });
    } else {
      throw unsupported();
    }
  }
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

export function safeStoryHtml(value: string): SafeStoryHtmlNode[] {
  return isStoryHtml(value) ? parseHtml(value) : [value];
}
