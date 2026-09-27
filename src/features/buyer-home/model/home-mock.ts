/* 홈(#367)의 FE 목업. 히어로 배너·마감 임박 프로젝트·추천 프로젝트는 주는 API가 없어
   (배너·추천 API 없음, 전체 프로젝트 마감순 목록 없음) Figma 홈 화면 `2315:72822`의 문구·이미지를 그대로 쓴다.
   API 응답 DTO가 아니며, API가 생기면 이 목록을 조회 결과로 바꾼다. 카드는 모두 디자인 확인용
   데모 상세로 보낸다. 데모 ID를 실제 프로젝트 ID처럼 쓰지 않는다. */
import { ddayLabel } from "@/entities/project/model/remaining-days";

export const homeDemoProjectHref = "/projects/demo-project";

export type HeroSlide = {
  /** 줄바꿈(`\n`)은 PC에서만 지킨다. 모바일은 한 줄이다. */
  title: string;
  /** PC 설명(`2315:71567`). */
  description: string;
  /** 모바일 설명. 모바일 배너(`2315:71245`)는 문구가 짧고 두 줄이다. */
  mobileDescription: string;
  image: string;
  href: string;
};

/* Figma에는 "1/3"로 표시된 첫 장만 있다. 나머지 두 장의 원본이 없어 카테고리 배너처럼 같은 장을 3장 둔다. */
const heroSlide: HeroSlide = {
  title: "작은 습관이 만드는\n더 나은 하루",
  description: "건강한 라이브 스타일을 위한 스마트 텀블러, 지금 펀딩 중입니다.",
  mobileDescription: "건강한 라이브 스타일을 위한\n스마트 텀블러",
  image: "/images/buyer-home/hero.jpg",
  href: homeDemoProjectHref,
};
export const heroSlides: readonly HeroSlide[] = [heroSlide, heroSlide, heroSlide];

export type MockProjectCard = {
  id: string;
  href: string;
  /** 줄바꿈(`\n`)은 Figma 원문 그대로 지킨다. */
  title: string;
  seller: string;
  image: string;
  /** 마감 임박의 D-N. */
  dday?: string;
  /** 추천 이유 칩. 실제 추천 사유 계산이 아니다. */
  reasons?: readonly string[];
};

/* PC `2315:71837` 카드 4장. 남은 일수는 Figma 표기다. */
export const deadlineProjects: readonly MockProjectCard[] = [
  { title: "하루의 끝을 편안하게,\n스마트 수면 조명", seller: "라이트온", remainingDays: 1 },
  { title: "매일 30초, 건강한 한 잔을 만드는 미니 블렌더", seller: "블렌디", remainingDays: 3 },
  { title: "흩어진 책상을 한 번에 정리하는 모듈 데스크", seller: "모듈랩", remainingDays: 1 },
  { title: "우리 아이의 식사 시간을 챙겨주는 스마트 급식기", seller: "펫밸런스", remainingDays: 4 },
].map(({ remainingDays, ...card }, index) => ({
  ...card,
  id: `deadline-${index + 1}`,
  href: homeDemoProjectHref,
  image: `/images/buyer-home/deadline-${index + 1}.jpg`,
  dday: ddayLabel(remainingDays),
}));

/* PC `2315:72021`은 아래 8종을 반복해 20칸을 채운다. 같은 카드를 되풀이하지 않고 8종만 보인다.
   문구·이미지가 LIVE 메인 추천 목업과 같아 이미지 파일은 `public/images/buyer-live`의 것을 쓴다. */
export const recommendedProjects: readonly MockProjectCard[] = [
  {
    title:
      "탄탄하고 촉촉한 피부를 위한 데일리 콜라겐 크림 · 피부에 부드럽게 밀착되어 매일 채우는 탄력",
    seller: "벨라포뮬라",
    image: "794e8",
    reasons: ["많이 본", "찜한 취향"],
  },
  {
    title:
      "아이패드를 노트북처럼 더 편리하게! 슬림한 디자인에 키보드와 거치 기능을 더한 올인원 아이패드 키보드 케이스",
    seller: "테크메이트 스튜디오",
    image: "08741",
    reasons: ["관심 카테고리"],
  },
  {
    title:
      "특별한 순간을 더 빛나게, 은은한 과실향과 섬세한 버블이 어우러진 프리미엄 샴페인 · 기념일과 홈파티를 위한 스파클링 셀렉션",
    seller: "벨라비노 셀렉트",
    image: "aef69",
    reasons: ["관심 카테고리"],
  },
  {
    title:
      "건조한 손끝에 촉촉함을 더하는 데일리 핸드크림 · 끈적임 없이 부드럽게 스며드는 산뜻한 보습 케어",
    seller: "모먼트뷰티",
    image: "d0523",
    reasons: ["많이 본", "찜한 취향"],
  },
  {
    title: "빠른 가열과 깔끔한 디자인을 담은 스테인리스 전기주전자",
    seller: "키친모먼트",
    image: "a2db7",
    reasons: ["관심 카테고리"],
  },
  {
    title:
      "집에서도 카페처럼 즐기는 깊고 풍부한 데일리 커피 · 고소한 풍미와 은은한 향이 살아있는 스페셜티 원두",
    seller: "선데이랩",
    image: "4f468",
    reasons: ["관심 카테고리"],
  },
  {
    title:
      "매일 부담 없이 바르는 촉촉한 데일리 선크림 · 끈적임 없이 산뜻하게 밀착되는 자외선 차단 & 수분 케어",
    seller: "선데이랩",
    image: "29bfa",
    reasons: ["많이 본", "찜한 취향"],
  },
  {
    title: "샤워 후 은은하게 퍼지는 향기, 하루 종일 기분 좋은 데일리 바디 미스트",
    seller: "센트모먼트",
    image: "9578c",
    reasons: ["많이 본", "찜한 취향"],
  },
].map(({ image, ...card }, index) => ({
  ...card,
  id: `recommended-${index + 1}`,
  href: homeDemoProjectHref,
  image: `/images/buyer-live/${image}.png`,
}));
