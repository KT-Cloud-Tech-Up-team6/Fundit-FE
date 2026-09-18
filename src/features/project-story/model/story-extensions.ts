import { mergeAttributes, Node } from "@tiptap/core";
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

export const storyExtensions = [
  StarterKit,
  TextAlign.configure({ types: ["paragraph"] }),
  TextStyle,
  Color,
  Image.configure({ inline: true, allowBase64: true }),
  StoryImageGroup,
  Youtube.configure({ nocookie: true }),
  Video,
];
