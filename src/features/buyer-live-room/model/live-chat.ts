/**
 * 실시간 채팅 한 줄. `ai`면 라벨을 윗줄에 두고 본문을 초록으로 그린다(Figma 295:50452). `seller`면 작성자를
 * 파랗게, `replyTo`가 있으면 본문 위에 답한 요약 질문을 인용으로 그린다(#564).
 */
export type LiveChatMessage = {
  id: string;
  author: string;
  text: string;
  ai?: boolean;
  seller?: boolean;
  replyTo?: string;
};

/** 서버가 메시지를 되돌려주면 `sent`, 메시지 검토에서 거절되면 `rejected`, 그 밖의 실패는 `failed`다. */
export type LiveChatSendResult = "sent" | "rejected" | "failed";

/**
 * 실제 LIVE 시청 화면의 채팅. 주면 목업 채팅 대신 이 목록과 입력을 그린다. `onRequireLogin`이 있으면
 * (비로그인) 입력칸 자리를 로그인으로 보내는 버튼으로 그린다.
 */
export type LiveChat = {
  messages: LiveChatMessage[];
  maxLength: number;
  onSend: (text: string) => Promise<LiveChatSendResult>;
  onRequireLogin?: () => void;
};

export const liveChatFailedNotice = "메시지를 보내지 못했습니다. 다시 시도해주세요.";
