// 검색·관심 목록과 상세 이동을 연결하는 목업이며 API 식별자가 아니다.
export const projectSearchDemo = [
  ["청소마켓", "선 없이 편리하게! 강력 흡입 무선청소기 특가전", "0b9d6"],
  ["클린하우스", "강력한 흡입력에 간편한 사용! 데일리 무선청소기", "7f446"],
  ["홈케어샵", "집안 구석구석 깔끔하게! 가볍고 강력한 무선청소기", "37dee"],
  ["리빙픽", "오늘만 특별할인! 인기 무선청소기 초특가 판매", "cb05e"],
  ["살림연구소", "매일 쓰기 좋은 무선청소기, 깔끔한 집의 시작", "003aa"],
  ["스마트리빙", "코드 없이 자유롭게! 가성비 무선청소기 추천 특가", "ee777"],
].map(([seller, title, image], index) => ({
  id: `search-project-${index + 1}`,
  seller,
  title,
  image: `/images/buyer-search/${image}.png`,
  thumbnail: `/images/buyer-search/project-${index + 1}.png`,
  progress: 10000,
  closed: index === 5,
  created: 6 - index,
  likes: [80, 120, 60, 90, 20, 45][index],
  deadline: [3, 5, 1, 2, 4, 0][index],
}));
