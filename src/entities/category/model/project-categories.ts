// PRD 4.2.4 / project-service V14__seed_categories_confirmed.sql.
// search-service의 카테고리 시드가 동기화되기 전까지 프로젝트 저장용 목록을 유지한다.
export const projectCategories: Readonly<Record<string, readonly string[]>> = {
  "테크·가전": ["생활가전", "로봇", "엔터테인먼트가전"],
  "홈·리빙": ["침실", "욕실", "주방", "청소", "인테리어", "방향제"],
  뷰티: ["스킨케어", "메이크업", "헤어케어", "네일", "향수"],
  패션: ["의류", "패션소품", "가방", "신발", "키즈"],
  푸드: ["산지직송", "로컬맛집", "헬스", "소스", "디저트", "음료", "주류"],
  스포츠: ["캠핑", "골프", "러닝", "자전거", "테니스", "헬스", "등산", "기타"],
  "캐릭터·굿즈": ["애니메이션", "게임", "케이팝", "크리에이터"],
};

export const mainCategories = Object.keys(projectCategories);
export const subcategoriesByMain = Object.fromEntries(
  Object.entries(projectCategories).map(([major, minors]) => [
    major,
    minors.map((name) => ({ value: name, label: name })),
  ]),
);
