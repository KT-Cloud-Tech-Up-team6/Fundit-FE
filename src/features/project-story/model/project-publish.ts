export type PublishRequirement = "basicInfo" | "story" | "rewards" | "privacyConsent";

/** 공개에 필요한 항목과 채우러 갈 판매자 프로젝트 탭. 탭이 없는 항목은 스토리 화면에서 해결한다. */
export const publishRequirements: Record<
  PublishRequirement,
  { label: string } & ({ tab: string } | { hint: string })
> = {
  basicInfo: { label: "기본 정보", tab: "basic-info" },
  story: { label: "스토리 본문", hint: "이 화면에서 작성" },
  rewards: { label: "리워드 1개 이상", tab: "rewards" },
  privacyConsent: { label: "개인정보 수집 동의", hint: "저장할 때 동의" },
};

/**
 * 422 `PROJECT_NOT_SUBMITTABLE` 메시지("필수 작성 항목이 완료되지 않았습니다: basicInfo, rewards")에서
 * 빠진 항목을 읽는다. BE가 `detail`을 채우지 않아 메시지 끝의 키 목록이 유일한 근거다.
 * 알아볼 수 없는 형식이면 빈 배열을 돌려주고, 화면은 서버 메시지를 그대로 보여 준다.
 */
export function missingPublishRequirements(message: string): PublishRequirement[] {
  const keys = /:\s*([\w\s,]+)$/.exec(message)?.[1].split(",") ?? [];
  return keys
    .map((key) => key.trim())
    .filter((key): key is PublishRequirement => Object.hasOwn(publishRequirements, key));
}
