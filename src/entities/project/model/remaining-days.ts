const DAY_MS = 86_400_000;

/**
 * 펀딩 마감까지 남은 일수. BE `ProjectStatsService.remainingDays`와 같게 남은 시간의
 * 일수 + 1이며, 마감이 지났으면 0이다. 같은 프로젝트가 목록과 펀딩 관리에서 같은 D-N으로 보인다.
 */
export function remainingDays(deadline: string, now = Date.now()) {
  const remaining = new Date(deadline).getTime() - now;
  return remaining < 0 ? 0 : Math.floor(remaining / DAY_MS) + 1;
}

export function ddayLabel(days: number) {
  return days <= 0 ? "종료" : `D-${days}`;
}
