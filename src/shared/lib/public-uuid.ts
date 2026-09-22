/* 공개 ID의 형식만 본다. BE는 UuidCreator.getTimeOrderedEpoch()로 UUIDv7을 발급하므로
   버전·변형 자리를 제한하면 실제 ID가 전부 404가 된다(#269·#276에서 두 번 났다).
   라우트 가드가 각자 정규식을 적다 같은 실수가 반복돼 여기 하나로 모은다. */
const publicUuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

/** 경로 파라미터가 공개 UUID 형식인지. 버전 자리는 보지 않는다. */
export function isPublicUuid(value: unknown): value is string {
  return typeof value === "string" && publicUuid.test(value);
}
