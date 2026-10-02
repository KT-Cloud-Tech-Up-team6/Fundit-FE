import type { FundingStoryMessageRequest } from "@/entities/project/api/story-api";

export type ChatMessageDraft = Omit<FundingStoryMessageRequest, "messageId">;

const sameRequest = (left: ChatMessageDraft, right: ChatMessageDraft) =>
  left.revision === right.revision &&
  left.text === right.text &&
  (left.attachmentUrls ?? []).join("\n") === (right.attachmentUrls ?? []).join("\n");

/**
 * 실패한 전송과 revision·글·첨부가 모두 같으면 그 `message_id`를 다시 쓴다(#556). AI는 같은 ID의 같은
 * 요청에 기존 채팅을 돌려주고, ID가 같은데 내용이 다르면 409를 준다. 그래서 하나라도 바뀌면 새 ID를 만든다.
 */
export function chatMessageRequest(
  failed: FundingStoryMessageRequest | null,
  draft: ChatMessageDraft,
  createId: () => string = () => crypto.randomUUID(),
): FundingStoryMessageRequest {
  if (failed && sameRequest(failed, draft)) return failed;
  return { ...draft, messageId: createId() };
}
