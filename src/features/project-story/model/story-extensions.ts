import { Extension, mergeAttributes, Node } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Youtube from "@tiptap/extension-youtube";
import StarterKit from "@tiptap/starter-kit";
import { StoryImageGroup } from "./image-layout";

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

/* toIntroContent가 직렬화하지 못하는 노드·마크는 저장 단계에서 거부된다. 마크다운 입력이나
   붙여넣기로만 생기는 것들은 애초에 만들지 못하게 해, 작성 후 저장에서야 막히는 일을 줄인다.
   인용구는 BE RichTextSanitizer의 허용 태그(b·strong·i·em·u·p·br·span·div·ul·ol·li)에 없어
   저장할 수 없다(#259). 툴바 컨트롤도 함께 제거했다. */
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
  TextAlign.configure({ types: ["paragraph"] }),
  TextStyle,
  Color,
  FontWeight,
  Image.configure({ inline: true, allowBase64: true }),
  StoryImageGroup,
  Youtube.configure({ nocookie: true }),
  Video,
];
