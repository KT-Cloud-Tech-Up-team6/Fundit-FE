/**
 * LIVE 좋아요 수처럼 좁은 자리에 쓰는 수의 짧은 표기. 1,000 미만은 그대로, 1,000 이상은 "2.4천",
 * 10,000 이상은 "1.2만"이다. 소수 첫째 자리까지 버림으로 자르고 ".0"은 쓰지 않는다. 원본에 규칙이 없어
 * FE가 정했고 디자인 확인 전이다(#526).
 */
export function compactCount(count: number) {
  if (count < 1_000) return count.toLocaleString("ko-KR");
  const [unit, suffix] = count < 10_000 ? [1_000, "천"] : [10_000, "만"];
  return `${(Math.floor((count * 10) / unit) / 10).toLocaleString("ko-KR")}${suffix}`;
}
