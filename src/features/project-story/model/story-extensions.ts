import { Extension, mergeAttributes, Node } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Youtube from "@tiptap/extension-youtube";
import StarterKit from "@tiptap/starter-kit";
import { StoryImageGroup } from "./image-layout";
import { storyBlockStyle } from "./story-content";

const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  addAttributes() {
    return { src: { default: null } };
  },
  parseHTML() {
    return [{ tag: "video[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(HTMLAttributes, { controls: "" })];
  },
});

/* BE RichTextSanitizer는 font-weight 100~900을 보존하는데 StarterKit의 bold 마크로는
   굵게/보통만 표현된다. Color와 같은 방식으로 textStyle에 굵기를 실어, 서버가 준 중간 굵기가
   에디터를 한 번 거쳤다고 사라지지 않게 한다. */
const FontWeight = Extension.create({
  name: "fontWeight",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontWeight: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontWeight || null,
            renderHTML: (attributes: Record<string, unknown>) =>
              attributes.fontWeight ? { style: `font-weight: ${attributes.fontWeight}` } : {},
          },
        },
      },
    ];
  },
});

/* AI Funding Story 하단(#331)의 섹션·제목(h2)·소제목(h3)·구분선. 강조선·간격이 style에 있어
   허용 선언만 문자열로 보존한다. StarterKit의 heading·horizontalRule 대신 직접 정의해
   "## "·"---" 입력 규칙과 단축키를 두지 않는다 — 툴바에 없는 서식을 새로 만들게 하지 않고,
   AI 결과를 불러와 고치고 다시 저장할 수만 있게 한다. */
const blockStyleAttribute = {
  style: {
    default: null,
    parseHTML: (element: HTMLElement) => storyBlockStyle(element.getAttribute("style")),
    renderHTML: (attributes: { style?: string | null }) =>
      attributes.style ? { style: attributes.style } : {},
  },
};

const StorySection = Node.create({
  name: "section",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes: () => blockStyleAttribute,
  parseHTML: () => [{ tag: "section" }],
  renderHTML: ({ HTMLAttributes }) => ["section", HTMLAttributes, 0],
});

const StoryHeading = Node.create({
  name: "heading",
  group: "block",
  content: "inline*",
  defining: true,
  addAttributes: () => ({ level: { default: 2, rendered: false }, ...blockStyleAttribute }),
  parseHTML: () => [
    { tag: "h2", attrs: { level: 2 } },
    { tag: "h3", attrs: { level: 3 } },
  ],
  renderHTML: ({ node, HTMLAttributes }) => [`h${node.attrs.level}`, HTMLAttributes, 0],
});

const StoryHorizontalRule = Node.create({
  name: "horizontalRule",
  group: "block",
  addAttributes: () => blockStyleAttribute,
  parseHTML: () => [{ tag: "hr" }],
  renderHTML: ({ HTMLAttributes }) => ["hr", HTMLAttributes],
});

/* toIntroContent가 직렬화하지 못하는 노드·마크는 저장 단계에서 거부된다. 마크다운 입력이나
   붙여넣기로만 생기는 것들은 애초에 만들지 못하게 해, 작성 후 저장에서야 막히는 일을 줄인다.
   인용구는 BE RichTextSanitizer의 허용 태그(b·strong·i·em·u·p·br·span·div·ul·ol·li·section·
   h2·h3·hr)에 없어 저장할 수 없다(#259). 툴바 컨트롤도 함께 제거했다. */
export const storyExtensions = [
  StarterKit.configure({
    heading: false,
    codeBlock: false,
    horizontalRule: false,
    code: false,
    strike: false,
    link: false,
    blockquote: false,
  }),
  StorySection,
  StoryHeading,
  StoryHorizontalRule,
  TextAlign.configure({ types: ["paragraph"] }),
  TextStyle,
  Color,
  FontWeight,
  Image.configure({ inline: true, allowBase64: true }),
  StoryImageGroup,
  Youtube.configure({ nocookie: true }),
  Video,
];
