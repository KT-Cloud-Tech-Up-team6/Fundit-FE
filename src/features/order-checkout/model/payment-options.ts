export const paymentCards = [
  "신한카드",
  "KB 국민카드",
  "현대카드",
  "삼성카드",
  "롯데카드",
  "하나카드",
  "우리카드",
  "NH농협카드",
  "BC카드",
];

// Figma의 신한카드 예시만 확정된 목업이다. 다른 카드의 실제 할부 정책은 PG 응답으로 대체한다.
export function installmentsForCard(card: string) {
  return card === "신한카드"
    ? ["일시불", "2개월 무이자", "3개월 무이자", "5개월 무이자", "6개월", "12개월"]
    : ["일시불"];
}
