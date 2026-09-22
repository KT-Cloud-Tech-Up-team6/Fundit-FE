import { isPublicUuid } from "./public-uuid";

/* 상세 경로는 검증한 공개 UUID만 받는다(docs/API_CONTRACT.md #216). 형식이 어긋난 값을
   그대로 넘기면 /projects/[projectId]가 UUID 분기에 실패해 목업 프로젝트를 그리므로,
   누락·null과 똑같이 상세 연결 대기로 취급한다. 형식 판정은 isPublicUuid 하나를 쓴다. */
export function projectDetailId(value: unknown): string | null {
  return isPublicUuid(value) ? value : null;
}
