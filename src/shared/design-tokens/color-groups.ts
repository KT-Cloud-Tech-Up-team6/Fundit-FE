/**
 * Figma `Fundit 디자인 시스템 > Foundations > Colors`의 분류를 그대로 옮긴 것이다.
 * 값은 담지 않는다. 순서와 역할 라벨만 선언하고 색상값은 globals.css에서 읽는다.
 */

export type PrimitiveGroup = {
  title: string;
  subtitle: string;
  prefix: string;
  /** 명명 스케일이라 이름순 정렬이 의미 없는 경우에만 쓴다. */
  order?: string[];
  roles?: Record<string, string>;
};

export const PRIMITIVE_GROUPS: PrimitiveGroup[] = [
  {
    title: "Blue",
    subtitle: "Primary_Live · LIVE 관련 컨텐츠에만 쓴다",
    prefix: "--blue-",
    roles: {
      "--blue-50": "Lightest",
      "--blue-500": "Primary",
      "--blue-700": "Hover",
      "--blue-900": "Darkest",
    },
  },
  {
    title: "Charcoal",
    subtitle: "Primary · 텍스트, 배경, Border 등 UI 전반",
    prefix: "--charcoal-",
    roles: {
      "--charcoal-900": "Text default",
      "--charcoal-200": "Border default",
    },
  },
  {
    title: "Grey",
    subtitle: "명명 스케일. 밝은 순서로 나열한다",
    prefix: "--grey-",
    order: [
      "--grey-white",
      "--grey-pearl-white",
      "--grey-bright-grey",
      "--grey-grey",
      "--grey-medium-grey",
      "--grey-dark-grey",
      "--grey-midnight-grey",
      "--grey-midnight-black",
      "--grey-black",
    ],
    roles: {
      "--grey-white": "Surface",
      "--grey-pearl-white": "Background",
    },
  },
  {
    title: "Alpha",
    subtitle: "Shadow가 참조하는 반투명 값",
    prefix: "--alpha-",
  },
];

/** 디자인 문서 02-4 Semantic Color 표와 같은 구성이다. */
export const STATUS_ROWS = [
  {
    category: "Success",
    usage: "완료, 성공",
    base: "--green",
    bright: "--bright-green",
    dark: "--dark-green",
  },
  {
    category: "Warning",
    usage: "주의, 경고",
    base: "--orange",
    bright: "--bright-orange",
    dark: "--dark-orange",
  },
  {
    category: "Error",
    usage: "오류, 실패",
    base: "--red",
    bright: "--bright-red",
    dark: "--dark-red",
  },
  {
    category: "Info",
    usage: "안내, 정보",
    base: "--grey-grey",
    bright: "--grey-bright-grey",
    dark: "--grey-dark-grey",
  },
] as const;

/** Figma Semantic 컬렉션의 하위 그룹. Elevation은 아직 Variable로 없다. */
export const SEMANTIC_GROUPS = [
  { title: "Layer", subtitle: "화면과 컴포넌트의 배경", prefix: "--layer-" },
  { title: "Text", subtitle: "텍스트의 중요도와 상태", prefix: "--text-" },
  { title: "Border", subtitle: "구분과 상태 표현", prefix: "--border-" },
  { title: "Status", subtitle: "상태와 피드백", prefix: "--status-" },
] as const;
