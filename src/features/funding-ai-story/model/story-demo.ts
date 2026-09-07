export const storyQuestions = [
  "이 제품, 특히 어떤 분들에게 추천하고 싶으신가요? (예: 반려동물과 함께 사는 가정, 머리카락 많이 빠지는 가족 등)",
  "성능이나 안전성 관련해서 획득하신 인증, 수상 이력, 또는 자체 시험 결과가 있다면 알려주세요.",
  "구매 후 A/S나 보증은 어떻게 제공되나요? (예: 무상 보증 기간, 부품 교환 정책 등)",
] as const;

export const demoProjectTitle = "[단 하나로 청소 끝] 흡입·물걸레·고온 세척까지, 올인원 청소기";
export const demoDescription =
  "흡입과 물걸레질을 한 번에 끝내는 올인원 청소기입니다. 침대와 소파 밑까지 청소하고, 사용 후에는 물걸레를 세척하고 건조할 수 있어요.";
export const initialStoryBody =
  "집중이 안 될 때, 저는 소리부터 바꿉니다.\n이 화이트노이즈 머신은 손바닥 위에 올라갈 만큼 작지만, 여섯 가지 자연음을 담고 있습니다.\n\n원목과 패브릭 스피커 그릴로 마감해 어느 책상 위에 두어도 자연스럽게 어울립니다.\n\n소리 하나로 공간의 분위기를 바꾸고 싶은 분들께 이 제품을 소개합니다.";

export type StoryStage =
  "description" | "questions" | "summarizing" | "summary" | "generating" | "ready" | "result";
export type StoryMessage = { role: "assistant" | "user"; text: string; question?: number };
export type StoryDemoState = {
  stage: StoryStage;
  description: string;
  answers: string[];
  revisions: string[];
  messages: StoryMessage[];
  generation: number;
};

export function createStoryState(): StoryDemoState {
  return {
    stage: "description",
    description: "",
    answers: [],
    revisions: [],
    generation: 0,
    messages: [
      {
        role: "assistant",
        text: "안녕하세요,\n상세페이지에 들어갈 스토리를 같이 만들어볼게요.\n판매하실 제품을 자유롭게 설명해주세요.",
      },
    ],
  };
}

export function storySummary(state: StoryDemoState) {
  return [
    state.description,
    ...state.answers.map(
      (answer, i) => `${["추천 대상", "인증·수상·시험", "A/S·보증"][i]}\n${answer}`,
    ),
    ...state.revisions.map((revision) => `수정 요청\n${revision}`),
  ].join("\n\n");
}

export function storyBody(state: StoryDemoState) {
  const heading =
    state.generation % 2 === 0
      ? "일상을 바꾸는 제품, 지금 만나보세요"
      : "당신의 일상에 필요한 새로운 변화";
  return `${heading}\n\n제품 이야기\n${storySummary(state)}\n\n함께 시작하는 펀딩\n제품 정보와 제공 조건을 확인하고 프로젝트에 함께해주세요.`;
}

export type StoryAction =
  | { type: "send"; text: string }
  | { type: "summary-ready" | "generate" | "ready" | "result" | "back" };

export function storyReducer(state: StoryDemoState, action: StoryAction): StoryDemoState {
  if (action.type === "send") {
    const text = action.text.trim();
    if (!text || !["description", "questions", "summary"].includes(state.stage)) return state;
    const messages: StoryMessage[] = [...state.messages, { role: "user", text }];
    if (state.stage === "description") {
      return {
        ...state,
        description: text,
        stage: "questions",
        messages: [
          ...messages,
          {
            role: "assistant",
            text: `말씀해주신 내용 잘 봤어요.\n스토리를 더 풍성하게 만들 수 있도록 ${storyQuestions.length}가지만 여쭤볼게요.`,
          },
          { role: "assistant", text: storyQuestions[0], question: 1 },
        ],
      };
    }
    if (state.stage === "questions") {
      const answers = [...state.answers, text];
      const next = storyQuestions[answers.length];
      return {
        ...state,
        answers,
        stage: next ? "questions" : "summarizing",
        messages: [
          ...messages,
          next
            ? { role: "assistant", text: next, question: answers.length + 1 }
            : { role: "assistant", text: "감사해요! 말씀해주신 내용을 바탕으로 정리해볼게요." },
        ],
      };
    }
    return { ...state, revisions: [...state.revisions, text], stage: "summarizing", messages };
  }
  if (action.type === "summary-ready" && state.stage === "summarizing") {
    return {
      ...state,
      stage: "summary",
      messages: [
        ...state.messages,
        {
          role: "assistant",
          text: `요약본이 준비됐어요!\n\n${storySummary(state)}\n\n확인해보시고, 그대로 진행하시거나 수정해주세요.`,
        },
      ],
    };
  }
  if (action.type === "generate" && ["summary", "result"].includes(state.stage))
    return { ...state, stage: "generating", generation: state.generation + 1 };
  if (action.type === "ready" && state.stage === "generating") return { ...state, stage: "ready" };
  if (action.type === "result" && state.stage === "ready") return { ...state, stage: "result" };
  if (action.type === "back" && state.stage === "result") return { ...state, stage: "summary" };
  return state;
}

export function storyFixture(stage: StoryStage): StoryDemoState {
  let state = createStoryState();
  if (stage === "description") return state;
  state = storyReducer(state, { type: "send", text: demoDescription });
  if (stage === "questions") return state;
  for (const answer of [
    "청소 시간을 줄이고 싶은 가정",
    "해당 사항 없음",
    "구체적인 보증 조건은 준비 중입니다.",
  ])
    state = storyReducer(state, { type: "send", text: answer });
  if (stage === "summarizing") return state;
  state = storyReducer(state, { type: "summary-ready" });
  if (stage === "summary") return state;
  state = storyReducer(state, { type: "generate" });
  if (stage === "generating") return state;
  state = storyReducer(state, { type: "ready" });
  return stage === "ready" ? state : storyReducer(state, { type: "result" });
}
