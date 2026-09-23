import type {
  SellerProject,
  SellerProjectListQuery,
  SellerProjectListResult,
  SellerProjectStatus,
} from "./seller-project";

const PAGE_SIZE = 8;

/* API가 붙으면 이 배열 대신 repository의 목록 응답을 같은 형태로 매핑한다. */
const projects: readonly SellerProject[] = [
  {
    id: "vacuum-cleaner",
    status: "active",
    thumbnail: "/images/funding-status/vacuum-cleaner.png",
    title: "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기",
    badges: [
      { label: "D-12", variant: "neutral" },
      { label: "목표 달성", variant: "success" },
    ],
    category: "테크·가전",
    period: "2026.07.01 - 2026.08.12",
    participantCount: 132,
    currentAmount: 1_280_000,
    goalAmount: 1_000_000,
  },
  {
    id: "steam-sterilizer",
    status: "active",
    thumbnail: "/images/seller-projects/project-02.png",
    title: "100℃ 트루스팀으로 유해 세균 99.999% 완벽 살균",
    badges: [
      { label: "D-11", variant: "neutral" },
      { label: "목표 미달성", variant: "warning" },
    ],
    category: "테크·가전",
    period: "2026.06.30 - 2026.08.11",
    participantCount: 92,
    currentAmount: 2_720_000,
    goalAmount: 4_000_000,
  },
  {
    id: "smart-washer",
    status: "active",
    thumbnail: "/images/seller-projects/project-03.jpeg",
    title: "[전기세 반토막!] 역대급 에너지 1등급 스마트 세탁기",
    badges: [
      { label: "D-8", variant: "neutral" },
      { label: "목표 달성", variant: "success" },
    ],
    category: "테크·가전",
    period: "2026.06.23 - 2026.08.04",
    participantCount: 332,
    currentAmount: 3_780_000,
    goalAmount: 3_780_000,
  },
  {
    id: "encore-pouch",
    status: "draft",
    thumbnail: "/images/seller-projects/project-04.jpeg",
    title: "마지막 앵콜 | 누적 13억, 더 이상 파우치 따로 챙기지 마세요",
    badges: [{ label: "D-12", variant: "neutral" }],
    draftPhaseLabel: "스토리 작성중",
  },
  ...[
    [
      "daily-sunglasses",
      "자외선은 걸러내고 스타일은 채우는, 데일리 선글라스",
      "패션잡화",
      64,
      2_960_000,
      2_000_000,
    ],
    [
      "minimal-keyboard",
      "타건감 하나로 승부하는 미니멀 키보드",
      "테크·가전",
      38,
      2_280_000,
      1_000_000,
    ],
    [
      "woven-watch-band",
      "내 시계에 꼭 맞는 컬러 매칭, 우븐 워치밴드",
      "액세서리",
      32,
      6_400_000,
      5_000_000,
    ],
    ["travel-pouch", "가방 안을 정리하는 여행용 파우치 세트", "리빙", 54, 1_320_000, 1_000_000],
    ["desk-lamp", "집중이 오래가는 눈부심 없는 데스크 램프", "리빙", 28, 840_000, 800_000],
  ].map(([id, title, category, participantCount, currentAmount, goalAmount], index) => ({
    id: String(id),
    status: "closed" as const,
    thumbnail: `/images/seller-projects/project-0${(index % 4) + 1}.${index % 4 === 1 ? "png" : "jpeg"}`,
    title: String(title),
    badges: [
      {
        label: ["제작 중", "펀딩 실패", "배송 완료", "배송 완료", "배송 완료"][index],
        variant: "neutral" as const,
      },
    ],
    category: String(category),
    period: "2026.06.08 - 2026.07.20",
    participantCount: Number(participantCount),
    currentAmount: Number(currentAmount),
    goalAmount: Number(goalAmount),
  })),
];

export function getSellerProject(projectId: string): SellerProject | undefined {
  return projects.find((project) => project.id === projectId);
}

export function getSellerProjectList(query: SellerProjectListQuery): SellerProjectListResult {
  const search = query.search?.trim().toLocaleLowerCase("ko-KR") ?? "";
  const statusCounts = { active: 0, draft: 0, closed: 0 } as Record<SellerProjectStatus, number>;
  for (const project of projects) statusCounts[project.status] += 1;
  const matching = projects.filter(
    (project) =>
      project.status === query.status &&
      (!search || project.title.toLocaleLowerCase("ko-KR").includes(search)),
  );
  const totalPages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const page = Math.min(Math.max(query.page ?? 1, 1), totalPages);

  return {
    items: matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    page,
    pageSize: PAGE_SIZE,
    statusCounts,
    totalItems: matching.length,
    totalPages,
  };
}
