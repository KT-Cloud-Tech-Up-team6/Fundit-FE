import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_CHAT_ENTRIES,
  STABLE_CONNECTION_MS,
  appendEntry,
  chatEndpoint,
  historyEntries,
  nextReconnect,
  parseChatFrame,
  prependHistory,
  removeEntry,
  sendMessageFrame,
  sendResultOf,
  stopsReconnect,
  toChatRows,
} from "./ivs-chat.ts";

const frame = (value) => JSON.stringify(value);

test("메시징 엔드포인트는 방 ARN의 리전을 쓰고, 채팅방 ARN이 아니면 붙을 곳이 없다", () => {
  assert.equal(
    chatEndpoint("arn:aws:ivschat:ap-northeast-2:123456789012:room/AbCdEf12"),
    "wss://edge.ivschat.ap-northeast-2.amazonaws.com",
  );
  assert.equal(
    chatEndpoint("arn:aws:ivschat:us-west-2:123456789012:room/x"),
    "wss://edge.ivschat.us-west-2.amazonaws.com",
  );
  // IVS 방송 채널 ARN이나 빈 값은 채팅방이 아니다.
  assert.equal(chatEndpoint("arn:aws:ivs:ap-northeast-2:123456789012:channel/x"), null);
  assert.equal(chatEndpoint("arn:aws:ivschat:ap-northeast-2:123456789012:room/"), null);
  assert.equal(chatEndpoint(""), null);
});

test("보내는 프레임은 SEND_MESSAGE 액션에 요청 id와 본문을 그대로 싣는다", () => {
  assert.deepEqual(JSON.parse(sendMessageFrame("req-1", '줄바꿈\n"따옴표" <b>')), {
    Action: "SEND_MESSAGE",
    RequestId: "req-1",
    Content: '줄바꿈\n"따옴표" <b>',
  });
});

test("받은 MESSAGE는 발신 회원 UUID·본문·요청 id로 읽는다", () => {
  assert.deepEqual(
    parseChatFrame(
      frame({
        Type: "MESSAGE",
        Id: "m1",
        RequestId: "req-1",
        Content: "배송 언제 되나요?",
        Sender: { UserId: "member-1", Attributes: {} },
        SendTime: "2026-09-30T01:00:00Z",
      }),
    ),
    {
      type: "entry",
      requestId: "req-1",
      entry: { kind: "message", id: "m1", senderId: "member-1", text: "배송 언제 되나요?" },
    },
  );
  // 닉네임은 BE가 토큰 속성으로 싣는다(#488). 비어 있으면 없는 것으로 본다.
  assert.deepEqual(
    parseChatFrame(
      frame({
        Type: "MESSAGE",
        Id: "m3",
        Content: "와",
        Sender: { UserId: "member-2", Attributes: { nickname: "펀딧러버" } },
      }),
    ),
    {
      type: "entry",
      requestId: undefined,
      entry: { kind: "message", id: "m3", senderId: "member-2", nickname: "펀딧러버", text: "와" },
    },
  );
  assert.equal(
    parseChatFrame(
      frame({
        Type: "MESSAGE",
        Id: "m4",
        Content: "와",
        Sender: { UserId: "member-2", Attributes: { nickname: " " } },
      }),
    ).entry.nickname,
    undefined,
  );
  // 본문이나 Id가 없으면 그릴 수 없다.
  assert.equal(parseChatFrame(frame({ Type: "MESSAGE", Id: "m2", Sender: {} })), null);
  assert.equal(parseChatFrame(frame({ Type: "MESSAGE", Content: "x" })), null);
});

test("판매자 답변 이벤트는 4KB를 넘어 본문이 빠져도 questionId로 받고, questionId가 없으면 버린다", () => {
  assert.deepEqual(
    parseChatFrame(
      frame({
        Type: "EVENT",
        Id: "e1",
        EventName: "seller-answer",
        Attributes: { questionId: "q1", answer: "  네, 가능합니다.  " },
      }),
    ),
    {
      type: "entry",
      entry: { kind: "seller-answer", id: "e1", questionId: "q1", answer: "  네, 가능합니다.  " },
    },
  );
  assert.deepEqual(
    parseChatFrame(
      frame({
        Type: "EVENT",
        Id: "e2",
        EventName: "seller-answer",
        Attributes: { questionId: "q2" },
      }),
    ),
    {
      type: "entry",
      entry: { kind: "seller-answer", id: "e2", questionId: "q2", answer: undefined },
    },
  );
  assert.equal(
    parseChatFrame(frame({ Type: "EVENT", Id: "e3", EventName: "seller-answer", Attributes: {} })),
    null,
  );
});

test("AI 답변 이벤트는 본문이 있을 때만 받고, 삭제 이벤트는 새·옛 속성 이름을 모두 읽는다", () => {
  assert.deepEqual(
    parseChatFrame(
      frame({
        Type: "EVENT",
        Id: "e4",
        EventName: "ai-answer",
        Attributes: {
          commentId: "101",
          aiQuestionId: "ai-q",
          answer: "물걸레 건조 모드가 있습니다.",
        },
      }),
    ),
    {
      type: "entry",
      entry: { kind: "ai-answer", id: "e4", answer: "물걸레 건조 모드가 있습니다." },
    },
  );
  assert.equal(
    parseChatFrame(
      frame({ Type: "EVENT", Id: "e5", EventName: "ai-answer", Attributes: { answer: " " } }),
    ),
    null,
  );
  assert.deepEqual(
    parseChatFrame(
      frame({
        Type: "EVENT",
        Id: "e6",
        EventName: "aws:DELETE_MESSAGE",
        Attributes: { MessageId: "m1" },
      }),
    ),
    { type: "delete", messageId: "m1" },
  );
  assert.deepEqual(
    parseChatFrame(
      frame({
        Type: "EVENT",
        Id: "e7",
        EventName: "aws:DELETE_MESSAGE",
        Attributes: { MessageID: "m2" },
      }),
    ),
    { type: "delete", messageId: "m2" },
  );
  // 화면이 쓰지 않는 이벤트와 JSON이 아닌 프레임은 무시한다.
  assert.equal(parseChatFrame(frame({ Type: "EVENT", Id: "e8", EventName: "user_joined" })), null);
  assert.equal(parseChatFrame("not json"), null);
  assert.equal(parseChatFrame(frame(["MESSAGE"])), null);
});

test("ERROR는 코드와 요청 id를 읽고, 406만 부적절한 단어 거절이다", () => {
  assert.deepEqual(
    parseChatFrame(
      frame({
        Type: "ERROR",
        Id: "x",
        RequestId: "req-9",
        ErrorCode: 406,
        ErrorMessage: "rejected",
      }),
    ),
    { type: "error", code: 406, requestId: "req-9" },
  );
  assert.equal(sendResultOf(406), "rejected");
  for (const code of [400, 401, 403, 413, 429, 500]) assert.equal(sendResultOf(code), "failed");
});

test("작성자는 판매자·나·닉네임(없으면 시청자)으로 가르고, 콘솔에서는 판매자 본인의 메시지도 판매자다", () => {
  const entries = [
    {
      kind: "message",
      id: "1",
      senderId: "seller",
      nickname: "쓱쓱생활연구소",
      text: "안녕하세요",
    },
    { kind: "message", id: "2", senderId: "me", nickname: "내닉네임", text: "궁금해요" },
    { kind: "message", id: "3", senderId: "other", nickname: "펀딧러버", text: "와" },
    { kind: "message", id: "4", senderId: "left", text: "탈퇴 회원" },
  ];
  assert.deepEqual(
    toChatRows(entries, { memberId: "me", sellerId: "seller" }).map((row) => row.author),
    ["판매자", "나", "펀딧러버", "시청자"],
  );
  assert.deepEqual(
    toChatRows(entries, { memberId: "seller", sellerId: "seller" }).map((row) => row.author),
    ["판매자", "내닉네임", "펀딧러버", "시청자"],
  );
  // 판매자를 아직 모르면(프로젝트 조회 전) 판매자 메시지도 닉네임으로 보인다. 비로그인은 "나"가 없다.
  assert.deepEqual(
    toChatRows(entries, {}).map((row) => row.author),
    ["쓱쓱생활연구소", "내닉네임", "펀딧러버", "시청자"],
  );
});

test("판매자 답변은 @everyone을 붙이고 본문이 빠졌으면 답변 목록에서 찾으며, AI 답변은 AI 매니저 줄로 그린다", () => {
  const rows = toChatRows(
    [
      { kind: "seller-answer", id: "a", questionId: "q1", answer: "가능합니다." },
      { kind: "seller-answer", id: "b", questionId: "q2" },
      { kind: "seller-answer", id: "c", questionId: "q3" },
      { kind: "ai-answer", id: "d", answer: "건조 모드가 있습니다." },
    ],
    { memberId: "me", answered: [{ questionId: "q2", answerText: "긴 답변" }] },
  );
  assert.deepEqual(rows, [
    { id: "a", author: "판매자", text: "@everyone 가능합니다." },
    { id: "b", author: "판매자", text: "@everyone 긴 답변" },
    // q3는 목록을 다시 받기 전이라 아직 그리지 않는다.
    { id: "d", author: "AI 매니저", text: "건조 모드가 있습니다.", ai: true },
  ]);
});

test("목록은 한도를 넘으면 오래된 것부터 버리고, 삭제는 그 메시지만 뺀다", () => {
  let entries = [];
  for (let index = 0; index < MAX_CHAT_ENTRIES + 2; index += 1)
    entries = appendEntry(entries, { kind: "message", id: String(index), senderId: "s", text: "" });
  assert.equal(entries.length, MAX_CHAT_ENTRIES);
  assert.equal(entries[0].id, "2");
  const removed = removeEntry(entries, "5");
  assert.equal(removed.length, MAX_CHAT_ENTRIES - 1);
  assert.equal(
    removed.some((entry) => entry.id === "5"),
    false,
  );
  // 없는 메시지를 지우라고 하면 목록을 바꾸지 않는다(다시 그리지 않게 같은 배열).
  assert.equal(removeEntry(entries, "nope"), entries);
});

test("입장 전 채팅은 받은 줄과 겹치는 메시지를 빼고 앞에 채우며, 한도를 넘으면 오래된 것부터 버린다", () => {
  const history = historyEntries([
    { messageId: "h1", senderId: "a", nickname: "첫 시청자", content: "처음", offsetSec: 3 },
    { messageId: "h2", senderId: "b", content: "닉네임 없음", offsetSec: 5 },
    { messageId: "live-1", senderId: "c", nickname: "겹침", content: "연결 뒤", offsetSec: 9 },
  ]);
  assert.deepEqual(history[1], { kind: "message", id: "h2", senderId: "b", text: "닉네임 없음" });
  const live = [
    { kind: "message", id: "live-1", senderId: "c", nickname: "겹침", text: "연결 뒤" },
    { kind: "ai-answer", id: "ai-1", answer: "답" },
  ];
  const filled = prependHistory(live, history);
  assert.deepEqual(
    filled.entries.map((entry) => entry.id),
    ["h1", "h2", "live-1", "ai-1"],
  );
  assert.equal(filled.added, 2);
  // 한도를 넘으면 가장 오래된 입장 전 채팅부터 버린다.
  const many = historyEntries(
    Array.from({ length: MAX_CHAT_ENTRIES }, (_, index) => ({
      messageId: `old-${index}`,
      senderId: "s",
      content: "",
      offsetSec: index,
    })),
  );
  const capped = prependHistory(live, many);
  assert.equal(capped.entries.length, MAX_CHAT_ENTRIES);
  assert.equal(capped.entries[0].id, "old-2");
  assert.equal(capped.entries.at(-1).id, "ai-1");
  assert.equal(capped.added, MAX_CHAT_ENTRIES);
});

test("토큰 API가 401·404·409면 재연결을 멈추고 503·네트워크 오류는 다시 시도한다", () => {
  assert.equal(stopsReconnect(401), true);
  assert.equal(stopsReconnect(404), true);
  assert.equal(stopsReconnect(409), true);
  assert.equal(stopsReconnect(503), false);
  assert.equal(stopsReconnect(500), false);
  assert.equal(stopsReconnect(undefined), false);
});

test("재연결은 연속 실패마다 1초에서 두 배로 늘려 30초에서 멈추고, 오래 열려 있던 연결이 끊기면 처음부터 센다", () => {
  let failures = 0;
  const delays = [];
  for (let index = 0; index < 7; index += 1) {
    const plan = nextReconnect(failures, 0);
    delays.push(plan.delayMs);
    failures = plan.failures;
  }
  assert.deepEqual(delays, [1000, 2000, 4000, 8000, 16000, 30000, 30000]);
  // 세션 만료처럼 한동안 열려 있다 끊긴 연결은 바로(1초 뒤) 다시 붙는다.
  assert.deepEqual(nextReconnect(failures, STABLE_CONNECTION_MS), { delayMs: 1000, failures: 1 });
  // 열리자마자 끊기면 실패로 쳐서 계속 늘린다.
  assert.deepEqual(nextReconnect(2, 500), { delayMs: 4000, failures: 3 });
});
