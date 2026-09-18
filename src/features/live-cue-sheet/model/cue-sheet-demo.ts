export type CueSheetType = "scenario" | "script";

export type CueScene = {
  id: string;
  title: string;
  duration: number;
  outline: string;
  script: string;
};

export type CueSheetProject = {
  title: string;
  category: string;
  period: string;
  description: string;
  participantCount: number;
  currentAmount: number;
  goalAmount: number;
  reward?: string;
  image?: string;
};

export type SavedCueSheet = {
  scenes: CueScene[];
  type: CueSheetType;
  minutes: number;
  answers?: string[];
};

export const demoProject: CueSheetProject = {
  title: "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기",
  image: "/images/seller-live/project.png",
  category: "테크·가전",
  period: "2026.07.01 - 2026.08.12",
  participantCount: 132,
  currentAmount: 6_400_000,
  goalAmount: 5_000_000,
  reward: "로보락 F25 본체 단품 699,000원",
  description:
    "로보락 F25는 180도 완전히 평평하게 눕혀지는 플랫 디자인으로 가구 밑 좁은 틈새까지 빈틈없이 청소합니다. 20,000Pa의 강력한 흡입력과 고온 세척 및 열풍 건조 기능을 갖추어 먼지 흡입부터 물걸레 관리까지 완벽하게 해결합니다. 여기에 스마트 오염도 감지 센서가 탑재되어 바닥 상태에 맞춰 흡입력과 물 분사량을 알아서 조절합니다. 가볍고 유연한 핸들링으로 힘들이지 않고 매일 깨끗한 바닥을 유지해 보세요.",
};

export const demoQuestions = [
  { label: "제품 설명", question: "라이브 진행 상품에 대해 간단하게 설명해주세요" },
  {
    label: "개발 동기·제작 과정",
    question: "제품 개발 동기, 제작 과정·예상 리스크와 리워드 가격, 발송 예정일을 알려주세요.",
  },
  {
    label: "예상 어려움·리워드",
    question:
      "개발 과정에서의 문제를 어떻게 해결했는지와, 예상 리스크·리워드 가격·발송 예정일도 알려주세요.",
  },
  { label: "시연 항목", question: "방송에서 직접 보여줄 수 있는 제품 시연은 무엇인가요?" },
  { label: "발송 일정·캠페인", question: "제품 발송 일정과 캠페인 진행 현황을 알려주세요." },
];

export const demoAnswers = [
  "물걸레 청소랑 진공청소가 한번에 되는 무선청소기예요. 흡입력도 세고 자동으로 걸레도 세척해줘요.",
  "기존에는 물걸레 청소기와 진공청소기를 따로 써야 해서 하나로 합쳤어요. 개발할 때 물통 위치 때문에 무게중심을 잡는 게 힘들었어요.",
  "부품 수급 문제로 발송이 2주 정도 걸릴 수도 있어요. 본체 단품 구성이고 가격은 69만9천원이에요.",
  "가구 밑 청소 시연과 자동세척 스테이션의 세척 과정을 보여드릴 수 있어요.",
  "결제 완료 후 2주 이내 순차 발송 예정이에요. 캠페인은 15일 중 3일차이고 달성률은 42%예요.",
];

const sceneTemplates = [
  ["오프닝", 60, "방송 목적과 오늘 다룰 순서 한 문장 소개\n제품 한 줄 소개"],
  ["제품 소개", 90, "로보락 F25의 핵심 기능과 사용 환경 소개"],
  ["제품 개발 배경", 60, "제품 개발 계기와 제작 과정 소개"],
  ["주요 특징 설명·상품 시연", 120, "핵심 기능 설명과 실제 사용 시연"],
  ["구성·일정 안내", 150, "로보락 F25 본체 단품 699,000원\n리워드 구성과 일정 안내"],
  ["언제 받나·예상 어려움", 60, "예상 발송 일정과 제작 시 유의사항 안내"],
  ["목표 현황", 50, "캠페인 진행 상황과 참여 방법 안내"],
  ["마무리 클로징", 10, "핵심 내용 요약과 감사 인사"],
] as const;

export function createDemoScenes(
  minutes: number,
  answers: string[],
  project = demoProject,
): CueScene[] {
  const answer = (index: number) =>
    answers[index] || "입력하지 않은 내용입니다. 방송 전에 확인해주세요.";
  const details = [
    `안녕하세요. 오늘 소개할 제품은 ${project.title}입니다.`,
    answers[0] || project.description,
    answer(1),
    answer(3),
    `${project.reward || "리워드 정보는 입력하지 않았습니다."}\n${answer(4)}`,
    answer(2),
    answer(4),
    `오늘 함께해 주셔서 감사합니다. ${project.title} 프로젝트에 관심을 가져주세요.`,
  ];
  let elapsed = 0;
  return sceneTemplates.map(([title, seconds, outline], index) => {
    const end = Math.round(((elapsed + seconds) * minutes) / 10);
    const start = Math.round((elapsed * minutes) / 10);
    elapsed += seconds;
    return {
      id: `scene-${index + 1}`,
      title,
      duration: end - start,
      outline:
        index === 1
          ? `${project.title}의 핵심 기능과 사용 환경 소개`
          : index === 4
            ? `${project.reward || "리워드 정보 확인 필요"}\n리워드 구성과 일정 안내`
            : outline,
      script: details[index],
    };
  });
}

export function formatCueTime(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
