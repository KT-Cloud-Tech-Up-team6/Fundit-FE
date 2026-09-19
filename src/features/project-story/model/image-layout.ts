import { Node } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { closeHistory } from "@tiptap/pm/history";
import { NodeSelection, type Transaction } from "@tiptap/pm/state";

export type ImageLayout = "vertical" | "horizontal";
type ImageSize = { width: number; height: number };

function imageColumns(node: ProseMirrorNode) {
  if (node.attrs.layout !== "horizontal") return "minmax(0, 1fr)";
  const ratios: number[] = [];
  node.forEach((image) => {
    const ratio = Number(image.attrs.width) / Number(image.attrs.height);
    ratios.push(Number.isFinite(ratio) && ratio > 0 ? ratio : 1);
  });
  const smallest = Math.min(...ratios);
  return ratios.map((ratio) => `minmax(0, ${ratio / smallest}fr)`).join(" ");
}

export function selectedImages({ doc, selection }: Pick<Transaction, "doc" | "selection">) {
  const images: { node: ProseMirrorNode; pos: number }[] = [];
  doc.nodesBetween(selection.from, selection.to, (node, pos) => {
    if (node.type.name === "image") images.push({ node, pos });
  });
  if (images.length < 2) return null;

  const from = images[0].pos;
  const to = images[images.length - 1].pos + 1;
  const $from = doc.resolve(from);
  const $to = doc.resolve(to);
  // 이미지 사이의 설명이나 목록을 없애거나 옮기지 않는다.
  let imageOnly = true;
  doc.nodesBetween(from, to, (node) => {
    if (!["paragraph", "image", "hardBreak", "storyImageGroup"].includes(node.type.name)) {
      imageOnly = false;
    }
  });
  if (!imageOnly || $from.depth !== 1 || $to.depth !== 1) return null;

  const group = $from.parent.type.name === "storyImageGroup" ? $from.parent : null;
  if (group && ($from.parent !== $to.parent || images.length !== group.childCount)) return null;
  if (!group && $to.parent.type.name === "storyImageGroup") return null;
  return { images, from, to, group, groupPos: $from.before() };
}

export function applyImageLayout(
  tr: Transaction,
  layout: ImageLayout,
  measure: (pos: number, node: ProseMirrorNode) => ImageSize | null,
) {
  const selected = selectedImages(tr);
  if (!selected) return false;
  const sizes = selected.images.map(({ pos, node }) => measure(pos, node));
  if (sizes.some((size) => !size || size.width <= 0 || size.height <= 0)) return false;
  const images = selected.images.map(({ node }, index) =>
    node.type.create({ ...node.attrs, ...sizes[index] }, null, node.marks),
  );
  const group = tr.doc.type.schema.nodes.storyImageGroup.create({ layout }, images);
  const from = selected.group ? selected.groupPos : selected.from;
  const to = selected.group ? selected.groupPos + selected.group.nodeSize : selected.to;
  closeHistory(tr).replaceRangeWith(from, to, group);
  // 문단 분할로 삽입 위치가 달라질 수 있어 새 묶음의 실제 위치를 찾는다.
  tr.doc.descendants((node, pos) => {
    if (node === group) tr.setSelection(NodeSelection.create(tr.doc, pos));
  });
  return true;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    storyImageGroup: {
      setStoryImageLayout: (layout: ImageLayout) => ReturnType;
    };
  }
}

export const StoryImageGroup = Node.create({
  name: "storyImageGroup",
  group: "block",
  content: "image+",
  defining: true,
  isolating: true,
  addAttributes() {
    return {
      layout: {
        default: "vertical",
        parseHTML: (element) =>
          element.getAttribute("data-story-image-layout") === "horizontal"
            ? "horizontal"
            : "vertical",
        renderHTML: ({ layout }) => ({ "data-story-image-layout": layout }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-story-image-layout]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, style: `grid-template-columns: ${imageColumns(node)}` }, 0];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      const update = (next: ProseMirrorNode) => {
        if (next.type.name !== this.name) return false;
        dom.dataset.storyImageLayout = next.attrs.layout;
        dom.style.gridTemplateColumns = imageColumns(next);
        return true;
      };
      update(node);
      return { dom, contentDOM: dom, update };
    };
  },
  addKeyboardShortcuts() {
    const removeLastImage = () => {
      const { selection } = this.editor.state;
      if (
        !(selection instanceof NodeSelection) ||
        selection.node.type.name !== "image" ||
        selection.$from.parent.type.name !== this.name ||
        selection.$from.parent.childCount !== 1
      )
        return false;
      return this.editor.commands.deleteRange({
        from: selection.$from.before(),
        to: selection.$from.after(),
      });
    };
    return { Backspace: removeLastImage, Delete: removeLastImage };
  },
  addCommands() {
    return {
      setStoryImageLayout:
        (layout) =>
        ({ tr, dispatch, view }) => {
          if (!dispatch) return !!selectedImages(tr);
          return applyImageLayout(tr, layout, (pos) => {
            const image = view.nodeDOM(pos);
            return image instanceof HTMLImageElement && image.naturalWidth && image.naturalHeight
              ? { width: image.naturalWidth, height: image.naturalHeight }
              : null;
          });
        },
    };
  },
});
