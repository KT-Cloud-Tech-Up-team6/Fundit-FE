export type CueSheetType = "scenario" | "script";

export type CueScene = {
  id: string;
  title: string;
  duration: number;
  outline: string;
  script: string;
};

export const demoProject = {
  title: "로보락 F25",
  category: "가전",
  period: "2026.07.01 - 2026.08.12",
  description:
    "로보락 F25는 180도 완전히 평평하게 눕혀지는 플랫 디자인으로 가구 밑 좁은 틈새까지 빈틈없이 청소합니다. 20,000Pa의 강력한 흡입력과 고온 세척 및 열풍 건조 기능을 갖추어 먼지 흡입부터 물걸레 관리까지 완벽하게 해결합니다. 여기에 스마트 오염도 감지 센서가 탑재되어 바닥 상태에 맞춰 흡입력과 물 분사량을 알아서 조절합니다. 가볍고 유연한 핸들링으로 힘들이지 않고 매일 깨끗한 바닥을 유지해 보세요.",
};

export const demoQuestions = [
  { label: "개발 동기", question: "제품을 만들게 된 계기와 해결하고 싶은 불편함을 알려주세요." },
  { label: "제작 과정", question: "제품을 개발하면서 겪은 과정이나 기억에 남는 이야기가 있나요?" },
  { label: "예상 어려움", question: "제작이나 배송 과정에서 예상되는 어려움을 알려주세요." },
  { label: "시연 항목", question: "방송에서 직접 보여줄 수 있는 제품 시연은 무엇인가요?" },
  { label: "발송 일정·캠페인", question: "제품 발송 일정과 캠페인 진행 현황을 알려주세요." },
];

export const demoAnswers = [
  "기존에는 물걸레 청소기와 진공청소기를 따로 사용해야 하는 번거로움을 해결하기 위해 두 기능을 하나로 합쳤습니다.",
  "개발 과정에서 물통 위치로 인해 무게중심을 잡는 데 어려움이 있었습니다.",
  "부품 수급 문제로 발송이 2주 정도 걸릴 수 있습니다.",
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

export function createDemoScenes(minutes: number, answers: string[]): CueScene[] {
  const details = [
    `안녕하세요. 오늘은 ${demoProject.title}를 직접 보면서 물걸레 청소와 진공청소기를 하나로 합치게 된 이야기부터 말씀드릴게요.`,
    demoProject.description,
    `${answers[0] || demoAnswers[0]}\n${answers[1] || demoAnswers[1]}`,
    answers[3] || demoAnswers[3],
    `리워드는 로보락 F25 본체 단품으로 699,000원에 준비했어요. ${answers[4] || demoAnswers[4]}`,
    answers[2] || demoAnswers[2],
    answers[4] || demoAnswers[4],
    "오늘 함께해 주셔서 감사합니다. 로보락 F25와 함께하는 새로운 청소 경험을 만나보세요.",
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
      outline,
      script: details[index],
    };
  });
}

export function formatCueTime(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
