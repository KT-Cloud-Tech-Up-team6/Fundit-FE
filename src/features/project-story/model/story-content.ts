import type { JSONContent } from "@tiptap/core";
import type { IntroBlock } from "@/entities/project/api/story-api";

/* 키는 CSS 속성의 camelCase라 React style로 그대로 넘길 수 있다. */
type TextStyle = {
  color?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  fontWeight?: string;
  fontSize?: string;
  lineHeight?: string;
  border?: string;
  borderTop?: string;
  borderLeft?: string;
  paddingLeft?: string;
  margin?: string;
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
  "section",
  "h2",
  "h3",
  "hr",
]);
const voidTags = new Set(["br", "hr"]);
/* AI Funding Story 하단(#331)의 섹션·제목·소제목·구분선. 서식을 통째로 style 문자열로 보존한다. */
const blockStyleTags = new Set(["section", "h2", "h3", "hr"]);

const PX = "\\d{1,3}px";
/* BE 정규식은 대소문자를 가린다. 단위·선 모양이 대문자면 BE가 버려 저장 뒤 선이 사라지므로 FE도 받지 않는다. */
const LINE = `\\d{1,2}px\\s+solid\\s+#[\\da-fA-F]{3,6}`;
/* BE RichTextSanitizer(#153, `be36715`)와 같은 선언 규칙이다. 어긋나면 저장 뒤 서식이 말없이 빠진다. */
const styleRules: Record<string, { key: keyof TextStyle; pattern: RegExp }> = {
  color: { key: "color", pattern: /^#[\da-f]{3,6}$/i },
  "text-align": { key: "textAlign", pattern: /^(left|center|right|justify)$/ },
  "font-weight": { key: "fontWeight", pattern: /^(bold|normal|[1-9]00)$/ },
  "font-size": { key: "fontSize", pattern: new RegExp(`^${PX}$`) },
  "line-height": { key: "lineHeight", pattern: new RegExp(`^(\\d(\\.\\d{1,2})?|${PX})$`) },
  border: { key: "border", pattern: new RegExp(`^(0|${LINE})$`) },
  "border-top": { key: "borderTop", pattern: new RegExp(`^${LINE}$`) },
  "border-left": { key: "borderLeft", pattern: new RegExp(`^${LINE}$`) },
  "padding-left": { key: "paddingLeft", pattern: new RegExp(`^${PX}$`) },
  margin: { key: "margin", pattern: new RegExp(`^(0|${PX})(\\s+(0|${PX})){0,3}$`) },
};
/* 문단·글자 서식은 에디터가 정렬·색·굵기로만 되살릴 수 있어 그 셋만 읽는다. */
const inlineStyleProperties = new Set(["color", "text-align", "font-weight"]);
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

export const escapeHtml = (value: string) =>
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

function sanitizeStyle(value: string | null | undefined, tag: string): TextStyle | undefined {
  const blockStyle = blockStyleTags.has(tag);
  if (!value || !(blockStyle || ["span", "p", "div"].includes(tag))) return undefined;
  const style: TextStyle = {};
  for (const declaration of value.split(";")) {
    const [rawProperty, raw] = declaration.split(":", 2);
    const property = rawProperty?.trim().toLowerCase() ?? "";
    const rule = styleRules[property];
    const normalized = raw?.trim().replace(/\s+/g, " ") ?? "";
    if (!rule || (!blockStyle && !inlineStyleProperties.has(property))) continue;
    if (rule.pattern.test(normalized)) Object.assign(style, { [rule.key]: normalized });
  }
  return Object.keys(style).length ? style : undefined;
}

const cssProperty = Object.fromEntries(
  Object.entries(styleRules).map(([property, { key }]) => [key, property]),
) as Record<keyof TextStyle, string>;
const styleText = (style: TextStyle | undefined) =>
  Object.entries(style ?? {})
    .map(([key, value]) => `${cssProperty[key as keyof TextStyle]}: ${value}`)
    .join("; ");

/** 섹션·제목·구분선의 style을 허용 선언만 남긴 문자열로 바꾼다. 남는 게 없으면 null. */
export function storyBlockStyle(value: string | null | undefined) {
  return styleText(sanitizeStyle(value, "section")) || null;
}

function parseHtml(html: string): SafeStoryHtmlNode[] {
  const root: { children: SafeStoryHtmlNode[] } = { children: [] };
  const stack: ({ children: SafeStoryHtmlNode[]; tag?: string } & Partial<
    Exclude<SafeStoryHtmlNode, string>
  >)[] = [root];
  const append = (node: SafeStoryHtmlNode) => stack.at(-1)?.children.push(node);
  const tokens = html.match(/<!--[\s\S]*?-->|<[^>]*>|[^<]+/g) ?? [];
  let ignoredDepth = 0;
  let afterBreak = false;
  for (const token of tokens) {
    if (token.startsWith("<!--")) continue;
    const followsBreak = afterBreak;
    afterBreak = false;
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
        /* <script/>처럼 닫는 태그가 따라오지 않는 형태에서 depth가 풀리지 않으면
           뒤따르는 본문이 통째로 사라진다. */
        if (!/\/\s*>$/.test(token)) ignoredDepth++;
        continue;
      }
      if (ignoredDepth || !allowedTags.has(tag)) continue;
      const styleMatch = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(match[2]);
      const node: Exclude<SafeStoryHtmlNode, string> = { tag, children: [] };
      const style = sanitizeStyle(styleMatch?.[1] ?? styleMatch?.[2] ?? styleMatch?.[3], tag);
      if (style) node.style = style;
      append(node);
      afterBreak = tag === "br";
      if (!voidTags.has(tag) && !/\/\s*>$/.test(token)) stack.push(node);
      continue;
    }
    if (ignoredDepth) continue;
    /* BE(jsoup)는 <br> 뒤 글자 앞에 줄바꿈과 들여쓰기를 넣어 돌려준다. 에디터는 공백을 그대로 보여 빈 줄이
       생기므로 버린다. FE는 HTML 본문에 줄바꿈 문자를 직접 쓰지 않는다(줄바꿈은 <br>이다). */
    const text = followsBreak ? token.replace(/^\r?\n[ \t]*/, "") : token;
    if (text) append(decodeEntities(text));
  }
  return root.children;
}

function markHtml(node: JSONContent, content: string) {
  return (node.marks ?? []).reduceRight((result, mark) => {
    if (mark.type === "bold") return `<strong>${result}</strong>`;
    if (mark.type === "italic") return `<em>${result}</em>`;
    if (mark.type === "underline") return `<u>${result}</u>`;
    if (mark.type === "textStyle") {
      const declarations: string[] = [];
      const { color, fontWeight } = mark.attrs ?? {};
      if (color) {
        if (!/^#[\da-f]{3,6}$/i.test(color)) throw unsupported();
        declarations.push(`color: ${color}`);
      }
      if (fontWeight) {
        if (!/^(bold|normal|[1-9]00)$/.test(String(fontWeight))) throw unsupported();
        declarations.push(`font-weight: ${fontWeight}`);
      }
      if (declarations.length) return `<span style="${declarations.join("; ")}">${result}</span>`;
      if (!Object.values(mark.attrs ?? {}).some(Boolean)) return result;
    }
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

const blockStyleAttribute = (value: unknown) => {
  const style = typeof value === "string" ? storyBlockStyle(value) : null;
  return style ? ` style="${escapeHtml(style)}"` : "";
};

function blockHtml(node: JSONContent): string {
  if (node.type === "paragraph") {
    const align = node.attrs?.textAlign;
    if (align && !["left", "center", "right", "justify"].includes(align)) throw unsupported();
    return `<p${align ? ` style="text-align: ${align}"` : ""}>${inlineHtml(node.content)}</p>`;
  }
  if (node.type === "heading") {
    const level = node.attrs?.level;
    if (level !== 2 && level !== 3) throw unsupported();
    return `<h${level}${blockStyleAttribute(node.attrs?.style)}>${inlineHtml(node.content)}</h${level}>`;
  }
  if (node.type === "horizontalRule") return `<hr${blockStyleAttribute(node.attrs?.style)}>`;
  if (node.type === "section") {
    return `<section${blockStyleAttribute(node.attrs?.style)}>${(node.content ?? [])
      .map(blockHtml)
      .join("")}</section>`;
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
  const boldWeight = marks.fontWeight === "bold" || Number(marks.fontWeight) >= 600;
  if (marks.bold || boldWeight) outputMarks.push({ type: "bold" });
  if (marks.italic) outputMarks.push({ type: "italic" });
  if (marks.underline) outputMarks.push({ type: "underline" });
  /* 서버는 100~900 굵기를 보존하지만 bold 마크로는 굵게/보통만 표현된다.
     bold로 대체할 수 없는 굵기는 textStyle에 실어 편집 왕복에서 잃지 않는다. */
  const textStyle = {
    ...(marks.color ? { color: marks.color } : {}),
    ...(marks.fontWeight && !boldWeight ? { fontWeight: marks.fontWeight } : {}),
  };
  if (Object.keys(textStyle).length) outputMarks.push({ type: "textStyle", attrs: textStyle });
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
    const blockStyle = styleText(node.style);
    if (
      node.tag === "div" &&
      node.children.some(
        (child) =>
          typeof child !== "string" &&
          ["p", "div", "ul", "ol", "section", "h2", "h3", "hr"].includes(child.tag),
      )
    ) {
      output.push(...htmlBlocks(node.children, { ...inherited, ...node.style }));
    } else if (node.tag === "section") {
      const children = htmlBlocks(node.children, inherited);
      output.push({
        type: "section",
        ...(blockStyle ? { attrs: { style: blockStyle } } : {}),
        content: children.length ? children : [{ type: "paragraph" }],
      });
    } else if (node.tag === "h2" || node.tag === "h3") {
      output.push({
        type: "heading",
        attrs: { level: node.tag === "h2" ? 2 : 3, ...(blockStyle ? { style: blockStyle } : {}) },
        content: inlineContent(node.children),
      });
    } else if (node.tag === "hr") {
      output.push({
        type: "horizontalRule",
        ...(blockStyle ? { attrs: { style: blockStyle } } : {}),
      });
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
          .map((item) => {
            const children = htmlBlocks(item.children, inherited);
            return {
              type: "listItem",
              content: children.length ? children : [{ type: "paragraph" }],
            };
          }),
      });
    } else if (node.tag === "br") {
      output.push({ type: "paragraph", content: [{ type: "hardBreak" }] });
    }
  }
  flushInline();
  return output;
}

/* 에디터가 만든 TEXT 블록은 항상 태그로 시작한다. 문자열 중간의 태그 모양까지 서식으로 보면
   `<b>` 같은 글자를 담은 과거 평문이 서식으로 오인돼 재저장 시 HTML로 굳으므로 시작만 본다. */
export function isStoryHtml(value: string) {
  return /^\s*<(?:b|strong|i|em|u|p|br|span|div|ul|ol|li|section|h2|h3|hr)\b[^>]*>/i.test(value);
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
