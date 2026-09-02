export type SignupTerm = {
  body: string;
  id: string;
  label: string;
  required: boolean;
};

/* 와이어프레임 기준 문구다. 약관 전문 확정본은 기획에서 받는다. */
export const signupTerms: SignupTerm[] = [
  {
    id: "service",
    label: "서비스 이용약관 동의 (필수)",
    required: true,
    body: "[필수] 서비스 이용약관 전문이 들어갑니다.",
  },
  {
    id: "privacy",
    label: "개인정보 수집·이용 동의 (필수)",
    required: true,
    body: "[필수] 개인정보 수집·이용 동의 전문이 들어갑니다.",
  },
  {
    id: "age",
    label: "만 14세 이상입니다 (필수)",
    required: true,
    body: "[필수] 만 14세 이상 확인 안내가 들어갑니다.",
  },
  {
    id: "marketing",
    label: "마케팅 정보 수신 동의 (선택)",
    required: false,
    body: "[선택] 마케팅 정보 수신 동의 전문이 들어갑니다.",
  },
  {
    id: "ai",
    label: "AI 개인화 서비스 활용 동의 (선택)",
    required: false,
    body: "[선택] AI 개인화 서비스 활용 동의 전문이 들어갑니다.",
  },
];

export const requiredTermIds = signupTerms.filter((term) => term.required).map((term) => term.id);
