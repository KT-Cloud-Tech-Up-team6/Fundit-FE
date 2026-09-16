export type LiveDemo = {
  title: string;
  seller: string;
  image: string;
  category?: string;
  avatar?: string;
  scheduled?: boolean;
  reasons?: string[];
};

const demos: Record<string, LiveDemo[]> = {
  search: [
    {
      title: "부모님 효도선물 무선청소기 가볍고 강력한 청소",
      seller: "청소마켓",
      image: "/images/buyer-search/0b9d6.png",
    },
    {
      title: "[대박할인] 가성비 무선청소기 역대급 사은품 증정",
      seller: "클린하우스",
      image: "/images/buyer-search/7f446.png",
    },
    {
      title: "[1+1 특가] 한정수량 무선청소기 오늘만 이 가격",
      seller: "홈케어샵",
      image: "/images/buyer-search/37dee.png",
    },
  ],
  new: [
    {
      title:
        "하루의 노폐물은 말끔하게, 피부의 촉촉함은 그대로! 순하고 편안한 클렌징 스킨케어 3종 세트 · 세안부터 보습까지 한 번에",
      seller: "클레어드랩",
      image: "/images/buyer-live/e5d64.png",
      scheduled: false,
    },
    {
      title:
        "매일의 시간을 더 스마트하게, 가볍고 세련된 데일리 디지털 손목시계 · 선명한 디스플레이와 편안한 착용감으로 완성하는 모던 워치",
      seller: "타임앤웨어",
      image: "/images/buyer-live/20f1f.png",
      scheduled: true,
    },
    {
      title:
        "매일 촉촉하게 채우는 데일리 수분크림 50ml · 끈적임 없이 산뜻한 보습 케어 · 민감한 피부도 편안하게",
      seller: "모어데이 뷰티",
      image: "/images/buyer-live/7ad9b.png",
      scheduled: false,
    },
    {
      title:
        "샤워 후 한 방울로 완성하는 촉촉한 바디 케어 · 끈적임 없이 부드럽게 스며드는 데일리 퍼퓸 바디오일 100ml",
      seller: "아로마티크랩",
      image: "/images/buyer-live/4b7ce.png",
      scheduled: true,
    },
  ],
  rank: [
    {
      title:
        "손끝에 은은하게 빛나는 데일리 링 · 어떤 스타일에도 자연스럽게 어울리는 심플 실버 반지 · 매일 착용하기 좋은 미니멀 주얼리",
      seller: "오브링스튜디오",
      image: "/images/buyer-live/ff65e.png",
      category: "악세사리",
      avatar: "/images/buyer-live/seller-1.png",
    },
    {
      title: "선명한 화면과 빠른 성능을 담은 슬림 노트북 · 휴대성까지 챙긴 데일리 업무용 노트북",
      seller: "모던테크랩",
      image: "/images/buyer-live/93c90.png",
      category: "테크·가전",
      avatar: "/images/buyer-live/seller-2.png",
    },
    {
      title:
        "바쁜 아침을 더 간편하게! 깔끔한 세안부터 면도·보습까지 한 번에 챙기는 남성 데일리 그루밍 3종 세트",
      seller: "맨즈포뮬라",
      image: "/images/buyer-live/ee561.png",
      category: "뷰티",
      avatar: "/images/buyer-live/seller-3.png",
    },
    {
      title: "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기",
      seller: "홈메이트랩",
      image: "/images/buyer-live/413b1.png",
      category: "테크·가전",
      avatar: "/images/buyer-live/seller-4.png",
    },
    {
      title: "맛있게 채우는 데일리 단백질! 부담 없이 즐기는 부드러운 초코 프로틴",
      seller: "밸런스핏",
      image: "/images/buyer-live/45a85.png",
      category: "식품",
      avatar: "/images/buyer-live/seller-5.png",
    },
  ],
  following: [
    {
      title: "목걸이부터 귀걸이까지 세련되게 완성하는 감각적인 미니멀 액세서리",
      seller: "아르엘주얼리",
      image: "/images/buyer-live/ce556.png",
    },
    {
      title: "풍부한 사운드와 편안한 착용감을 담은 프리미엄 무선 헤드셋 · 음악부터 게임까지",
      seller: "사운드웨이브",
      image: "/images/buyer-live/0157a.png",
    },
    {
      title:
        "메마른 피부에 촉촉함을 채우는 데일리 수분 앰플 · 가볍게 흡수되어 산뜻하게 마무리되는 집중 보습 케어",
      seller: "하이드로랩 뷰티",
      image: "/images/buyer-live/9d862.png",
    },
    {
      title: "강력한 바람부터 은은한 자연풍까지 원하는 대로 조절하는 저소음 데일리 선풍기",
      seller: "에어리홈",
      image: "/images/buyer-live/a166a.png",
    },
  ],
  recommended: [
    {
      title:
        "탄탄하고 촉촉한 피부를 위한 데일리 콜라겐 크림 · 피부에 부드럽게 밀착되어 매일 채우는 탄력",
      seller: "벨라포뮬라",
      image: "/images/buyer-live/794e8.png",
      reasons: ["많이 본", "찜한 취향"],
    },
    {
      title:
        "아이패드를 노트북처럼 더 편리하게! 슬림한 디자인에 키보드와 거치 기능을 더한 올인원 아이패드 키보드 케이스",
      seller: "테크메이트 스튜디오",
      image: "/images/buyer-live/08741.png",
      reasons: ["관심 카테고리"],
    },
    {
      title:
        "특별한 순간을 더 빛나게, 은은한 과실향과 섬세한 버블이 어우러진 프리미엄 샴페인 · 기념일과 홈파티를 위한 스파클링 셀렉션",
      seller: "벨라비노 셀렉트",
      image: "/images/buyer-live/aef69.png",
      reasons: ["관심 카테고리"],
    },
    {
      title:
        "건조한 손끝에 촉촉함을 더하는 데일리 핸드크림 · 끈적임 없이 부드럽게 스며드는 산뜻한 보습 케어",
      seller: "모먼트뷰티",
      image: "/images/buyer-live/d0523.png",
      reasons: ["많이 본", "찜한 취향"],
    },
    {
      title: "빠른 가열과 깔끔한 디자인을 담은 스테인리스 전기주전자",
      seller: "키친모먼트",
      image: "/images/buyer-live/a2db7.png",
      reasons: ["관심 카테고리"],
    },
    {
      title:
        "집에서도 카페처럼 즐기는 깊고 풍부한 데일리 커피 · 고소한 풍미와 은은한 향이 살아있는 스페셜티 원두",
      seller: "선데이랩",
      image: "/images/buyer-live/4f468.png",
      reasons: ["관심 카테고리"],
    },
    {
      title:
        "매일 부담 없이 바르는 촉촉한 데일리 선크림 · 끈적임 없이 산뜻하게 밀착되는 자외선 차단 & 수분 케어",
      seller: "선데이랩",
      image: "/images/buyer-live/29bfa.png",
      reasons: ["많이 본", "찜한 취향"],
    },
    {
      title: "샤워 후 은은하게 퍼지는 향기, 하루 종일 기분 좋은 데일리 바디 미스트",
      seller: "센트모먼트",
      image: "/images/buyer-live/9578c.png",
      reasons: ["많이 본", "찜한 취향"],
    },
  ],
  upcomingFollowing: [
    {
      title:
        "특별한 순간을 더 빛나게, 은은한 과실향과 섬세한 버블이 어우러진 프리미엄 샴페인 · 기념일과 홈파티를 위한 스파클링 셀렉션",
      seller: "벨라비노 셀렉트",
      image: "/images/buyer-live/aef69.png",
    },
    {
      title: "목걸이부터 귀걸이까지 세련되게 완성하는 감각적인 미니멀 액세서리",
      seller: "아르엘주얼리",
      image: "/images/buyer-live/ce556.png",
    },
    {
      title:
        "매일의 시간을 더 스마트하게, 가볍고 세련된 데일리 디지털 손목시계 · 선명한 디스플레이와 편안한 착용감으로 완성하는 모던 워치",
      seller: "타임앤웨어",
      image: "/images/buyer-live/20f1f.png",
    },
    {
      title:
        "매일의 시간을 더 스마트하게, 가볍고 세련된 데일리 디지털 손목시계 · 선명한 디스플레이와 편안한 착용감으로 완성하는 모던 워치",
      seller: "타임앤웨어",
      image: "/images/buyer-live/9d862.png",
    },
  ],
  scheduled: [
    {
      title: "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기",
      seller: "홈메이트랩",
      image: "/images/buyer-live/413b1.png",
      category: "테크·가전",
    },
    {
      title:
        "손끝에 은은하게 빛나는 데일리 링 · 어떤 스타일에도 자연스럽게 어울리는 심플 실버 반지 · 매일 착용하기 좋은 미니멀 주얼리",
      seller: "오브링스튜디오",
      image: "/images/buyer-live/ff65e.png",
      category: "악세사리",
    },
    {
      title: "선명한 화면과 빠른 성능을 담은 슬림 노트북 · 휴대성까지 챙긴 데일리 업무용 노트북",
      seller: "모던테크랩",
      image: "/images/buyer-live/93c90.png",
      category: "테크·가전",
    },
    {
      title: "맛있게 채우는 데일리 단백질! 부담 없이 즐기는 부드러운 초코 프로틴",
      seller: "밸런스핏",
      image: "/images/buyer-live/45a85.png",
      category: "식품",
    },
    {
      title:
        "탄탄하고 촉촉한 피부를 위한 데일리 콜라겐 크림 · 피부에 부드럽게 밀착되어 매일 채우는 탄력",
      seller: "벨라포뮬라",
      image: "/images/buyer-live/794e8.png",
      category: "뷰티",
    },
  ],
  subscribed: [
    {
      title:
        "하루의 노폐물은 말끔하게, 피부의 촉촉함은 그대로! 순하고 편안한 클렌징 스킨케어 3종 세트 · 세안부터 보습까지 한 번에",
      seller: "클레어드랩",
      image: "/images/buyer-live/e5d64.png",
    },
    {
      title:
        "매일의 시간을 더 스마트하게, 가볍고 세련된 데일리 디지털 손목시계 · 선명한 디스플레이와 편안한 착용감으로 완성하는 모던 워치",
      seller: "타임앤웨어",
      image: "/images/buyer-live/20f1f.png",
    },
    {
      title: "빠른 가열과 깔끔한 디자인을 담은 스테인리스 전기주전자",
      seller: "키친모먼트",
      image: "/images/buyer-live/a2db7.png",
    },
    {
      title: "풍부한 사운드와 편안한 착용감을 담은 프리미엄 무선 헤드셋 · 음악부터 게임까지",
      seller: "사운드웨이브",
      image: "/images/buyer-live/0157a.png",
    },
    {
      title: "강력한 바람부터 은은한 자연풍까지 원하는 대로 조절하는 저소음 데일리 선풍기",
      seller: "에어리홈",
      image: "/images/buyer-live/a166a.png",
    },
  ],
  upcomingRecommended: [
    {
      title:
        "바쁜 아침을 더 간편하게! 깔끔한 세안부터 면도·보습까지 한 번에 챙기는 남성 데일리 그루밍 3종 세트",
      seller: "맨즈포뮬라",
      image: "/images/buyer-live/ee561.png",
    },
    {
      title:
        "건조한 손끝에 촉촉함을 더하는 데일리 핸드크림 · 끈적임 없이 부드럽게 스며드는 산뜻한 보습 케어",
      seller: "모먼트뷰티",
      image: "/images/buyer-live/d0523.png",
    },
    {
      title:
        "매일 부담 없이 바르는 촉촉한 데일리 선크림 · 끈적임 없이 산뜻하게 밀착되는 자외선 차단 & 수분 케어",
      seller: "선데이랩",
      image: "/images/buyer-live/29bfa.png",
    },
    {
      title:
        "집에서도 카페처럼 즐기는 깊고 풍부한 데일리 커피 · 고소한 풍미와 은은한 향이 살아있는 스페셜티 원두",
      seller: "선데이랩",
      image: "/images/buyer-live/4f468.png",
    },
    {
      title: "샤워 후 은은하게 퍼지는 향기, 하루 종일 기분 좋은 데일리 바디 미스트",
      seller: "센트모먼트",
      image: "/images/buyer-live/9578c.png",
    },
    {
      title:
        "메마른 피부에 촉촉함을 채우는 데일리 수분 앰플 · 가볍게 흡수되어 산뜻하게 마무리되는 집중 보습 케어",
      seller: "하이드로랩 뷰티",
      image: "/images/buyer-live/9d862.png",
    },
    {
      title:
        "매일 촉촉하게 채우는 데일리 수분크림 50ml · 끈적임 없이 산뜻한 보습 케어 · 민감한 피부도 편안하게",
      seller: "모어데이 뷰티",
      image: "/images/buyer-live/7ad9b.png",
    },
    {
      title:
        "샤워 후 한 방울로 완성하는 촉촉한 바디 케어 · 끈적임 없이 부드럽게 스며드는 데일리 퍼퓸 바디오일 100ml",
      seller: "아로마티크랩",
      image: "/images/buyer-live/4b7ce.png",
    },
  ],
};

export function getLiveDemo(id: string, upcoming = false): LiveDemo {
  const [section, number] = id.split("-");
  const key =
    section === "follow"
      ? upcoming
        ? "upcomingFollowing"
        : "following"
      : section === "recommended" && upcoming
        ? "upcomingRecommended"
        : section;
  const items = demos[key];
  return items[(Number(number) - 1) % items.length];
}

export const subscribedIds = Array.from({ length: 5 }, (_, index) => `subscribed-${index + 1}`);

// 화면 간 이동 검증을 위한 명시적인 목업 관계이며 API 식별자가 아니다.
const demoConnections = Object.entries(demos).flatMap(([section, items]) =>
  items.map((data, index) => ({
    projectId: `demo-${section}-${index + 1}`,
    liveId: `${section}-${index + 1}`,
    data,
    hasLive:
      !section.startsWith("upcoming") &&
      !["scheduled", "subscribed"].includes(section) &&
      !data.scheduled,
  })),
);

export function getLiveDemoConnection(id: string, upcoming = false) {
  if (id === "demo-live") {
    return { projectId: "demo-project", liveId: id, data: demos.rank[3], hasLive: true };
  }
  const match =
    /^(new|rank|follow|following|recommended|scheduled|subscribed|upcomingFollowing|upcomingRecommended|search)-(\d+)$/.exec(
      id,
    );
  if (!match) return undefined;
  const section =
    match[1] === "follow"
      ? upcoming
        ? "upcomingFollowing"
        : "following"
      : match[1] === "recommended" && upcoming
        ? "upcomingRecommended"
        : match[1];
  const number = Number(match[2]);
  if (number < 1 || number > 30) return undefined;
  return demoConnections.find(
    (connection) =>
      connection.liveId === `${section}-${((number - 1) % demos[section].length) + 1}`,
  );
}

export function getProjectDemoConnection(projectId: string) {
  return projectId === "demo-project"
    ? getLiveDemoConnection("demo-live")
    : demoConnections.find((connection) => connection.projectId === projectId);
}

export function getUpcomingProjectHref(id: string) {
  return `/projects/${getLiveDemoConnection(id, true)!.projectId}?tab=story`;
}
