/**
 * 새소식 번호 페이지네이션의 전체 페이지 수. 응답에 `totalPages`가 있으면 그 값을 쓰고, 0건(`totalPages: 0`)이면
 * 1페이지다. 값이 없을 때만 다음 페이지 여부로 현재 페이지(0부터)까지, 또는 한 페이지 더 센다(#379).
 */
export function noticePageCount(
  data: { totalPages?: number; hasNext?: boolean } | undefined,
  page: number,
): number {
  if (data && Number.isFinite(data.totalPages)) return Math.max(1, Math.floor(data.totalPages!));
  return data?.hasNext ? page + 2 : page + 1;
}
