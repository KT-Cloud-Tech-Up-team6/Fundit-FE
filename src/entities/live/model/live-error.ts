import { ApiError } from "@/shared/api/api-error";

/** 설정 저장·시작이 막히는 409. live-service는 시작·종료한 LIVE에서만 이 충돌을 낸다. */
export const LIVE_ALREADY_STARTED =
  "이미 시작했거나 종료된 LIVE입니다. LIVE 스튜디오에서 상태를 확인해 주세요.";

/**
 * LIVE·큐시트 요청 실패를 화면 문구로 옮긴다. BE `message`는 내부 문구라 화면에 쓰지 않는다
 * (BE 9/7 답변). live-service는 공통 오류 코드만 던져 상태와 코드가 1:1이라 상태로 나눈다.
 * 409는 요청마다 뜻이 달라 부르는 쪽이 `conflict`로 문구를 준다.
 */
export function liveFailureReason(error: unknown, conflict = LIVE_ALREADY_STARTED): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return "입력한 내용을 확인해 주세요.";
    if (error.status === 401) return "로그인이 필요합니다. 다시 로그인해 주세요.";
    /* 남의 LIVE와 없는 LIVE를 BE가 같은 404로 답한다(security.md S10). */
    if (error.status === 403 || error.status === 404)
      return "LIVE를 찾을 수 없거나 권한이 없습니다. LIVE 스튜디오에서 확인해 주세요.";
    if (error.status === 409) return conflict;
    if (error.status === 429) return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (error instanceof TypeError) return "인터넷 연결을 확인해 주세요.";
  return "잠시 후 다시 시도해 주세요.";
}

/** 주소의 LIVE가 없거나 이 판매자의 것이 아니다. 큐시트 404("아직 없음")와 구분할 때 쓴다. */
export function isUnavailableLive(error: unknown) {
  return error instanceof ApiError && (error.status === 403 || error.status === 404);
}
