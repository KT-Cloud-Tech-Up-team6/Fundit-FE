import assert from "node:assert/strict";
import test from "node:test";
import { chatMessageRequest } from "./chat-message.ts";

const draft = {
  revision: 2,
  text: "이 사진을 참고해 주세요.",
  attachmentUrls: ["https://cdn/a.png"],
};
let sequence = 0;
const createId = () => `message-${++sequence}`;

test("실패한 전송과 revision·글·첨부가 같으면 같은 message_id로 다시 보낸다", () => {
  const failed = chatMessageRequest(null, draft, createId);
  const retried = chatMessageRequest(failed, { ...draft, attachmentUrls: ["https://cdn/a.png"] });
  assert.equal(retried.messageId, failed.messageId);
});

test("글·첨부·revision 중 하나라도 바뀌면 새 message_id를 만든다", () => {
  const failed = chatMessageRequest(null, draft, createId);
  for (const changed of [
    { ...draft, text: "다른 글" },
    { ...draft, attachmentUrls: [] },
    { ...draft, attachmentUrls: ["https://cdn/a.png", "https://cdn/b.png"] },
    { ...draft, revision: 3 },
  ]) {
    assert.notEqual(chatMessageRequest(failed, changed, createId).messageId, failed.messageId);
  }
});

test("첨부 없이 보낸 글과 빈 첨부 목록은 같은 요청으로 본다", () => {
  const failed = chatMessageRequest(null, { revision: 1, text: "글만" }, createId);
  const retried = chatMessageRequest(failed, { revision: 1, text: "글만", attachmentUrls: [] });
  assert.equal(retried.messageId, failed.messageId);
});
