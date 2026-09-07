export type DemoQuestion = {
  id: string;
  title: string;
  originals: string[];
  suggestion: string | null;
  answer: string;
};

export const demoQuestions: DemoQuestion[] = [
  {
    id: "vacuum",
    title: "일반 진공 청소 모드(물 없이 청소)도 가능한가요?",
    originals: [
      "f25 이거 물 없이 그냥 청소기로도 쓸 수 있나요?",
      "일반 진공 청소 모드 따로 있어요?",
      "물 안 넣고 먼지만 흡입하는 것도 돼요?",
      "이거 그냥 마른 청소는 안 되나?",
      "로보락 f25 물걸레 기능 끄고 진공 청소만 하는 법 아시는 분?",
      "물통 비우고 쓰면 일반 청소기처럼 쓸 수 있음?",
      "흡입만 하는 모드도 지원하나요?",
      "f25로 카펫 청소할 때 물 안 나오게 할 수 있어요?",
      "물청소 말고 그냥 먼지 청소만 하고 싶을 땐 어떡해요?",
      "이거 진공 청소 기능만 단독으로 작동 돼요?",
      "물 없이 청소하는 모드 이름이 뭔가요?",
      "f25 이거 물 없이 그냥 청소기로도 쓸 수 있나요?",
    ],
    suggestion:
      "로보락 F25는 기본적으로 진공 흡입과 물걸레 청소가 동시에 이루어지는 습건식 올인원 청소기이지만, 상황에 따라 물 없이 청소하는 효과를 낼 수 있습니다.",
    answer:
      "네, 가능합니다. 로보락 F25는 물걸레 청소뿐만 아니라 흡입 청소만 단독으로 진행할 수 있는 '물걸레 건조 모드(또는 진공 흡입 모드)'를 지원합니다.",
  },
  {
    id: "gap",
    title: "가구 밑 좁은 틈새도 청소가 가능한가요?",
    originals: Array.from({ length: 8 }, () => "가구 밑 좁은 틈새도 청소가 가능한가요?"),
    suggestion: "가구 밑을 청소하는 모습을 방송에서 확인해 주세요.",
    answer: "가구 밑 좁은 틈새를 청소하는 모습을 직접 보여드릴게요.",
  },
  {
    id: "models",
    title: "F25 'Ultra'와 'ACE' 모델의 가장 큰 차이점은 무엇인가요?",
    originals: Array.from({ length: 6 }, () => "Ultra와 ACE 모델은 어떤 점이 다른가요?"),
    suggestion: null,
    answer: "",
  },
  {
    id: "cleaning",
    title: "청소 후 롤러(걸레) 세척과 건조는 어떻게 하나요?",
    originals: Array.from({ length: 4 }, () => "롤러 세척과 건조는 어떻게 하나요?"),
    suggestion: "자동세척 스테이션에서 진행하는 과정을 확인해 주세요.",
    answer: "자동세척 스테이션에서 롤러를 세척하는 과정을 보여드릴게요.",
  },
  {
    id: "hair",
    title: "머리카락이나 반려동물의 털이 롤러에 엉키지 않나요?",
    originals: Array.from({ length: 3 }, () => "반려동물 털도 청소할 수 있나요?"),
    suggestion: "롤러에 남은 털을 관리하는 방법을 시연합니다.",
    answer: "청소 후 롤러를 확인하고 관리하는 방법을 함께 보여드릴게요.",
  },
  {
    id: "carpet",
    title: "러그나 카펫 위에서도 일반 진공 청소기처럼 쓸 수 있나요?",
    originals: Array.from({ length: 3 }, () => "러그나 카펫에서도 쓸 수 있나요?"),
    suggestion: "바닥 소재에 따른 사용 방법을 확인해 주세요.",
    answer: "바닥 소재에 맞는 사용 방법은 제품 설명서에서 확인해 주세요.",
  },
];

export const demoCues = [
  {
    title: "오프닝",
    until: "01:00",
    outline: [
      "방송 목적과 오늘 다룰 순서 한 문장 소개",
      "제품 한 줄 소개",
      "로보락 F25 — 물걸레 청소와 진공청소기 동시 가능한 무선청소기",
    ],
    script:
      "안녕하세요. 오늘은 로보락 F25를 직접 보면서, 왜 물걸레 청소기와 진공청소기를 하나로 합치게 됐는지부터 말씀드릴게요. 처음 오신 분도 제품이 어떻게 쓰이는지 바로 보실 수 있게 준비했어요.\n로보락 F25는 물걸레 청소와 진공청소기 동시 가능한 무선청소기예요. 기존에는 물걸레 청소기와 진공청소기를 따로 써야 해서, 청소할 때마다 기기를 바꿔야 하는 번거로움이 있었어요. 그 과정을 하나로 줄여보자는 생각에서 시작했어요.\n개발할 때는 물통 위치 때문에 무게중심을 잡는 일이 쉽지 않았어요. 물걸레 기능과 진공청소 기능을 함께 담으면서도, 실제로 손에 들고 움직일 때의 균형을 계속 고민해야 했어요. 오늘 방송에서는 그 배경도 제품을 보면서 말씀드릴게요. 이어서 가구 밑을 청소하는 모습부터 보여드리고, 자동세척 스테이션 뚜껑도 열어서 자동 걸레 세척 과정이 어떻게 보이는지 확인해볼게요. 마지막에는 리워드와 발송 안내까지 순서대로 말씀드릴게요.\n지금 캠페인은 15일 가운데 3일차 진행 중이고, 현재 달성률은 42%예요. 리워드는 로보락 F25 본체 단품으로 699,000원에 준비했어요. 그럼 먼저 F25가 왜 이런 구성으로 만들어졌는지부터 보여드릴게요.",
  },
  ...[
    ["제품 소개", "02:30"],
    ["제품 개발 배경", "03:30"],
    ["주요 특징 설명·증거 시연", "05:30"],
    ["구성·일정 안내", "08:00"],
    ["현재 만나야 하는 이유", "09:00"],
    ["질문과 답변", "09:50"],
    ["마무리", "10:00"],
  ].map(([title, until]) => ({
    title,
    until,
    outline: [title, "제품을 보여주며 안내합니다."],
    script: `이제 ${title} 순서입니다. 제품을 보면서 차근차근 안내해 드릴게요. 궁금한 점은 채팅으로 남겨 주세요.`,
  })),
];

export type ConsoleDemoState = {
  phase: "ready" | "live" | "ended";
  answers: Record<string, string>;
  messages: { id: number; author: string; text: string }[];
  publishedIds: string[];
};

export function createConsoleDemo(phase: ConsoleDemoState["phase"]): ConsoleDemoState {
  const answeredIds =
    phase === "ended" ? ["vacuum", "gap", "cleaning", "hair", "carpet"] : ["gap", "cleaning"];
  return {
    phase,
    answers:
      phase === "ready"
        ? {}
        : Object.fromEntries(
            demoQuestions.filter((q) => answeredIds.includes(q.id)).map((q) => [q.id, q.answer]),
          ),
    messages:
      phase === "ready"
        ? []
        : Array.from({ length: 9 }, (_, index) => ({
            id: index,
            author: "아이디",
            text:
              index === 8 ? "내가 제일 최신 댓글이야" : "신규 채팅 신규 채팅 신규 채팅 신규 채팅",
          })),
    publishedIds: [],
  };
}

export type ConsoleDemoAction =
  | { type: "start" }
  | { type: "end" }
  | { type: "chat"; text: string }
  | { type: "answer"; questionId: string; text: string }
  | { type: "publish"; ids: string[] };

export function consoleDemoReducer(
  state: ConsoleDemoState,
  action: ConsoleDemoAction,
): ConsoleDemoState {
  switch (action.type) {
    case "start":
      return state.phase === "ready"
        ? { ...createConsoleDemo("live"), messages: state.messages }
        : state;
    case "end":
      return state.phase === "live" ? { ...state, phase: "ended" } : state;
    case "chat":
    case "answer": {
      const text = action.text.trim();
      if (state.phase !== "live" || !text) return state;
      if (
        action.type === "answer" &&
        !demoQuestions.some((q) => q.id === action.questionId && q.suggestion)
      )
        return state;
      return {
        ...state,
        answers:
          action.type === "answer"
            ? { ...state.answers, [action.questionId]: text }
            : state.answers,
        messages: [
          ...state.messages,
          { id: (state.messages.at(-1)?.id ?? -1) + 1, author: "판매자", text },
        ],
      };
    }
    case "publish":
      return state.phase === "ended"
        ? {
            ...state,
            publishedIds: [...new Set(action.ids)].filter((id) => Boolean(state.answers[id])),
          }
        : state;
  }
}
