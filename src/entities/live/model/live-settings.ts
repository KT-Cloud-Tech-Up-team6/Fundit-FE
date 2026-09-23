import type { LiveSettingsBody } from "../api/live-session-api";

/** BE `LiveSettingsRequest.introText`의 `@Size(max = 200)`. */
export const LIVE_INTRO_MAX_LENGTH = 200;

/**
 * `<input type="date">`·`<input type="time">` 값 → ISO-8601 UTC.
 *
 * 두 입력은 **판매자의 로컬 시각**이고 BE는 `Instant`를 받는다. `new Date("YYYY-MM-DDTHH:mm")`은
 * 로컬 시간대로 해석되므로 여기서 변환이 끝난다. 값이 비었거나 해석되지 않으면 `null`이다 —
 * 지금 시각 같은 기본값으로 대신 보내지 않는다.
 */
export function toScheduledStartAt(date: string, time: string): string | null {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/**
 * ISO-8601 → `<input type="date">`·`<input type="time">` 값. {@link toScheduledStartAt}의 역이다.
 * 값이 없거나 해석되지 않으면 둘 다 빈 문자열이다 — 임시저장에 예약이 없을 때 오늘을 지어내지 않는다.
 */
export function toScheduledInputs(value: string | null | undefined) {
  const at = value ? new Date(value) : null;
  if (!at || Number.isNaN(at.getTime())) return { date: "", time: "" };
  const pad = (part: number) => String(part).padStart(2, "0");
  return {
    date: `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`,
    time: `${pad(at.getHours())}:${pad(at.getMinutes())}`,
  };
}

export type LiveSettingsInput = {
  categoryMajor?: string | null;
  categoryMinor?: string | null;
  introText?: string | null;
  /** 이미 ISO-8601로 바꾼 값. 예약하지 않으면 `null`이다. */
  scheduledStartAt?: string | null;
};

/**
 * 부분 업데이트 본문.
 *
 * 값이 없는 필드는 **키 자체를 뺀다**. `null`을 보내도 BE는 "건드리지 않음"으로 읽지만,
 * 키를 빼는 쪽이 의도를 그대로 드러낸다. 카테고리는 대분류가 있을 때만 보낸다 —
 * 소분류만으로는 BE가 저장할 수 없다.
 */
export function toLiveSettingsBody(input: LiveSettingsInput): LiveSettingsBody {
  const body: LiveSettingsBody = {};
  if (input.categoryMajor) {
    body.category = { major: input.categoryMajor, minor: input.categoryMinor ?? null };
  }
  const introText = input.introText?.trim();
  if (introText) body.introText = introText.slice(0, LIVE_INTRO_MAX_LENGTH);
  if (input.scheduledStartAt) body.scheduledStartAt = input.scheduledStartAt;
  return body;
}

/** 보낼 것이 하나도 없는 본문인지. PATCH를 건너뛸 때 쓴다. */
export function isEmptyLiveSettingsBody(body: LiveSettingsBody): boolean {
  return Object.keys(body).length === 0;
}
