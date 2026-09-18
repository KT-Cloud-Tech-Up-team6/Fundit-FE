import assert from "node:assert/strict";
import test from "node:test";
import { getSchema } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { history, undo, redo } from "@tiptap/pm/history";
import { applyImageLayout, selectedImages, StoryImageGroup } from "./image-layout.ts";

const schema = getSchema([StarterKit, Image.configure({ inline: true }), StoryImageGroup]);
const picture = (src) => schema.nodes.image.create({ src, alt: src });
const paragraph = (...children) => schema.nodes.paragraph.create(null, children);
const dimensions = (_, node) => ({ width: node.attrs.src === "wide" ? 400 : 200, height: 200 });
function stateFor(children, from, to) {
  const doc = schema.nodes.doc.create(null, children);
  return EditorState.create({
    doc,
    selection: TextSelection.create(doc, from, to),
    plugins: [history()],
  });
}
function imageSources(doc) {
  const sources = [];
  doc.descendants((node) => {
    if (node.type.name === "image") sources.push(node.attrs.src);
  });
  return sources;
}

test("선택한 두 이미지만 묶고 앞뒤 텍스트와 선택 밖 이미지를 보존한다", () => {
  const before = schema.text("앞");
  const after = schema.text("뒤");
  const state = stateFor(
    [paragraph(before, picture("wide"), picture("tall"), after, picture("outside"))],
    2,
    4,
  );
  const tr = state.tr;
  assert.equal(applyImageLayout(tr, "horizontal", dimensions), true);
  tr.doc.check();
  assert.equal(tr.doc.textContent, "앞뒤");
  assert.deepEqual(imageSources(tr.doc), ["wide", "tall", "outside"]);
  const group = tr.selection.node;
  assert.equal(group.type.name, "storyImageGroup");
  assert.equal(group.childCount, 2);
  assert.equal(group.attrs.layout, "horizontal");
  assert.equal(group.firstChild.attrs.width, 400);
  assert.equal(group.lastChild.attrs.alt, "tall");
  assert.deepEqual(schema.nodeFromJSON(tr.doc.toJSON()).toJSON(), tr.doc.toJSON());
});

test("이미지 전용 문단 사이도 묶고 텍스트 문단은 유지한다", () => {
  const state = stateFor(
    [paragraph(picture("wide")), paragraph(picture("tall")), paragraph(schema.text("설명"))],
    1,
    5,
  );
  const tr = state.tr;
  assert.equal(applyImageLayout(tr, "vertical", dimensions), true);
  tr.doc.check();
  assert.equal(tr.doc.textContent, "설명");
  assert.equal(tr.selection.node.childCount, 2);
});

test("설명이 이미지 사이에 있거나 하나만 선택되면 변경하지 않는다", () => {
  const states = [
    stateFor([paragraph(picture("wide"), schema.text("설명"), picture("tall"))], 1, 5),
    stateFor([paragraph(picture("wide"), picture("tall"))], 1, 2),
    stateFor(
      [paragraph(picture("wide")), paragraph(schema.text("설명")), paragraph(picture("tall"))],
      1,
      9,
    ),
  ];
  for (const state of states) {
    assert.equal(selectedImages(state), null);
    const tr = state.tr;
    assert.equal(applyImageLayout(tr, "horizontal", dimensions), false);
    assert.equal(tr.docChanged, false);
  }
});

test("로드되지 않은 이미지가 있으면 부분 변경 없이 정렬을 거부한다", () => {
  const state = stateFor([paragraph(picture("wide"), picture("tall"))], 1, 3);
  const tr = state.tr;
  assert.equal(
    applyImageLayout(tr, "horizontal", () => null),
    false,
  );
  assert.equal(tr.docChanged, false);
});

test("묶음의 방향을 바꿔도 이미지 순서·비율 정보가 유지된다", () => {
  let state = stateFor([paragraph(picture("wide"), picture("tall"))], 1, 3);
  const first = state.tr;
  assert.equal(applyImageLayout(first, "horizontal", dimensions), true);
  state = state.apply(first);
  const next = state.tr;
  assert.equal(applyImageLayout(next, "vertical", dimensions), true);
  next.doc.check();
  assert.deepEqual(imageSources(next.doc), ["wide", "tall"]);
  assert.equal(next.selection.node.attrs.layout, "vertical");
  assert.equal(next.selection.node.childCount, 2);
});

test("정렬은 한 번에 실행 취소하고 다시 실행할 수 있다", () => {
  let state = stateFor([paragraph(picture("wide"), picture("tall"))], 1, 3);
  const original = state.doc.toJSON();
  const tr = state.tr;
  applyImageLayout(tr, "horizontal", dimensions);
  state = state.apply(tr);
  const grouped = state.doc.toJSON();
  assert.equal(
    undo(state, (transaction) => {
      state = state.apply(transaction);
    }),
    true,
  );
  assert.deepEqual(state.doc.toJSON(), original);
  assert.equal(
    redo(state, (transaction) => {
      state = state.apply(transaction);
    }),
    true,
  );
  assert.deepEqual(state.doc.toJSON(), grouped);
});

test("삽입 직후 정렬을 실행 취소해도 삽입한 이미지는 남는다", () => {
  let state = stateFor([paragraph()], 1, 1);
  state = state.apply(state.tr.insert(1, [picture("wide"), picture("tall")]));
  state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1, 3)));
  const inserted = state.doc.toJSON();
  const tr = state.tr;
  applyImageLayout(tr, "horizontal", dimensions);
  state = state.apply(tr);
  undo(state, (transaction) => {
    state = state.apply(transaction);
  });
  assert.deepEqual(state.doc.toJSON(), inserted);
});
