# API 계약 초안

## 프로젝트 스토리의 서식 저장 계약 (#234)

- 2026-09-21 BE develop `ae1e032`의 `RichTextSanitizer`를 기준으로 TEXT 블록에 허용 HTML을 저장한다. b/strong/i/em/u/p/br/span/div/ul/ol/li와 제한된 color/text-align/font-weight만 허용한다. 링크·스크립트·이벤트·임의 CSS를 추가로 허용하지 않는다.
- 기존 일반 텍스트·줄바꿈은 복원 호환을 유지하며 이미지·영상은 별도 IMAGE/VIDEO_URL 블록으로 유지한다. 서버가 보존하지 못하는 레이아웃·서식은 저장 성공으로 가장하지 않는다.
- 공개 화면은 허용 태그·스타일만 React 요소로 표시하며 API HTML을 그대로 삽입하지 않는다. 편집 저장·재진입·공개 표시를 함께 검증한다. AI 생성 API 및 실제 BE 배포 확인은 이번 범위와 구분한다.

## 제작·배송 코드 대조 및 FE 연결 (#198)

- 2026-09-20 BE develop `e435378f`(#78) 기준으로 주문 목록은 `/api/v1/orders`의 UUID 계약으로 통합됐으며 `/api/v2/orders`는 제거됐다. 제작·배송의 `/api/v2/projects/{projectId}/fulfillment` 및 `/api/v2/projects/{projectId}/fundings/{fundingId}/shipment` UUID 계약은 유지한다.
- `/seller/projects/{UUID}?tab=fulfillment`에서 소유자 preview 조회 후 단계 전환·최신 상세 기록·일정 변경을 저장하고 재조회한다. 날짜 입력은 한국 시간 기준으로 Instant에 변환한다. 첨부와 기록 수정 API는 없어 저장된 것처럼 처리하지 않는다.
- `/my/fundings/{UUID}/fulfillment`와 `/history`는 내 주문 v1 목록을 페이지 순회해 프로젝트 UUID 관계를 확인한 뒤 제작·배송을 조회한다. 서버 `canConfirmReceipt`가 참일 때 수령 확인을 제공한다. 외부 택배 추적은 연결하지 않는다.
- 단계 조회는 단계별 최신 상세 1건만 제공한다. 전체 기록 이력이 아닌 최신 기록과 별도의 일정 변경 이력을 표시한다. 미갱신 경고는 서버 `isUpdateOverdue`를 사용한다.
- 송장 등록 API 클라이언트는 준비했지만 판매자 발송 대상 목록은 내부 API만 있어 UI 연결을 보류한다. `/seller/projects/{UUID}/shipping`에서 목업 주문의 송장을 실제 저장하지 않으며 임의 UUID 입력이나 내부 서비스 우회 호출을 제공하지 않는다.
- 실제 Gateway·판매자/구매자 테스트 계정·자동 택배 상태 연동은 미검증이다. 실서버 연결 전 목록 공개 API, 전체 기록/첨부 계약과 권한을 확인해야 한다.
- 주문 생성 재시도는 사용자·프로젝트별로 요청 내용의 해시와 생성 결과를 보관합니다. 결제 대기 주문의 동일 요청만 재사용하며, 다른 요청은 기존 주문 확인·취소를 안내합니다. 서버에서 확인한 비대기 상태의 주문은 새 요청 결과로 재사용하지 않습니다. 결과가 불확실하거나 상태 조회가 실패하면 추가 생성하지 않습니다. 목표 달성 주문의 상세에서는 제작·배송 API 현황으로 이동합니다.

## 쿠폰 조건 표시 보완 (#218)

- BE develop `d7ea517`의 `CouponBoxItemResponse`, `Coupon`, `CouponIssuanceService`를 대조했다. `minFundingAmount`는 배송비를 제외한 리워드 합계의 최소 펀딩 금액, `perMemberLimit`은 인당 발급 한도다. 사용 가능 횟수로 해석하지 않는다.
- 쿠폰 선택 카드에 최소 금액·적용 대상·발급 한도·한국 시간 기준 유효기간을 표시한다. `targetScope`는 ALL/CATEGORY/PROJECT/MAKER이며 카테고리는 BE 대분류명, 프로젝트는 주문의 UUID와 비교한다. 대상 판매자 이름은 응답에 없으므로 임의 ID 매핑 없이 지정 판매자 전용으로 안내한다.
- BE의 원본 쿠폰 누락 응답(null 대상·유효기간, 0 한도·금액)과 알 수 없는 값은 확인 필요로 표시한다. 최소 금액 0은 대상 메타데이터가 있을 때만 제한 없음으로 표현한다.
- 조건 표시는 안내이며 선택·적용 판정과 최종 금액은 기존 주문 preview 응답을 유지한다. 최고 할인율·최대 할인액은 응답 필드가 없어 새로 계산하거나 표시하지 않는다.
- 디자인 확인 범위: 쿠폰 프레임 `746:7329`·`746:7389`, 화면정의 `737:7172`·`737:7177`·`737:7182`, 이력 `643:9086`, 결제 섹션 `643:9085`의 주변 텍스트 지침. 확인한 쿠폰 노드에는 prototype 연결·annotations가 없다. 문서의 과거 결제 지침 `1132:15072`는 이번 도구 조회에서 찾을 수 없어 최신 해당 노드의 재확인은 미완료다. 이번 작업은 기존 카드의 조건 표시만 보완한다.

## 주문·결제 코드 대조 및 FE 연결 (#197)

- 2026-09-20 BE develop `e435378f`(#78) 기준으로 주문 preview/생성/목록은 `/api/v1/orders`의 UUID 계약을 사용한다. 이전 `/api/v2/orders` 컨트롤러와 Gateway 매핑은 제거됐다. 상세/취소는 기존 `/api/v1/orders/{orderId}`를 유지한다. 리워드·옵션은 조회 응답의 숫자 ID를 전달한다.
- `/funding/{UUID}/checkout`은 실제 리워드·배송지와 서버 미리보기 금액을 사용한다. 주문 생성 후 `/my/fundings/{orderId}`로 이동한다. 주문 목록의 `finalAmount`는 BE에서 할인 전 합산하므로 목록에서 최종 결제금액으로 표시하지 않고 상세의 서버 금액을 사용한다.
- `/my/fundings`는 서버 상태/페이지 필터를 사용하며 기존 목업 검색·기간 필터는 서버 계약에 없어 적용하지 않는다. 상세의 `availableActions`에 CANCEL이 있을 때만 취소를 제공한다. `/payment/result?orderId={UUID}`는 새로고침 가능한 주문 조회다.
- `/api/v2/payments`의 시도 생성은 서버 주문 UUID를 사용한다. `/confirm`의 `orderId`는 별도의 `pgOrderId`이며 주문 UUID와 혼용하지 않는다.
- 현재 BE의 결제 승인은 실제 Toss 클라이언트를 호출한다. 목업은 테스트 코드에서만 확인됐으므로 FE는 임의 paymentKey를 생성하거나 결제 성공을 합성하지 않는다. 시도 생성 이후 승인 콜백/PG 위젯은 환경·계약 확인 대기다. PortOne 본인인증과 별개다.
- 주문 생성에는 BE 멱등 키 계약이 없다. 같은 탭에서 회원·프로젝트별 sessionStorage 기록으로 진행 중/성공 후 재생성을 막는다. 네트워크·5xx·파싱 실패 후에는 생성 여부 확인 없이 재시도하지 않는다. 4xx 확정 실패는 재시도 가능하다. 다중 탭·기기 중복 방지 및 동일 프로젝트 재주문 정책은 BE 보완이 필요하다.
- 쿠폰은 보유 목록·주문 미리보기·단일 쿠폰 선택을 연결한다. `appliedCoupons` 항목은 BE의 `couponCode`·`issuerType`·`discountType`을 사용하며 쿠폰별 할인액을 가정하지 않는다. 적립금·결제수단 선택·승인 완료 화면의 API 연결은 제외한다. 실제 Gateway/PG 검증은 미완료이며 HTTP 테스트 대역 검증과 구분한다.

이하 계약 초안은 2026-09-07 작성, 2026-09-14 갱신 당시 전달 명세를 기록한 내용이다. 이후 구현에 확인한 차이는 위 도메인별 코드 대조 절과 각 기능 문서에 기록하며, 전체 계약 확정을 뜻하지 않는다. 관련 작업은 [#47](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/47)이다.

## 1. 목적·근거·우선순위

이 문서는 전달받은 자료를 정리한 문서다. 인증·회원의 일부 코드를 읽어 명세와 비교했지만 BE 서버 실행·테스트 실행·실제 응답 대조는 하지 않았다.

- API 버저닝·표준 에러 형식 정의서.
- 2026-09-14 FE에 전달된 OpenAPI 3.1.0 `auth-api.yaml`, `member-api.yaml`(각 info.version은 v1). BE 설명은 “지금 작업중인 내용 제외하고 develop 브랜치 최신버전으로 작성된 auth, member”다. 기준 커밋·추출 시점·제외된 API 목록은 전달되지 않았다.
- 2026-09-08 FE에 전달된 이전 BE 추가 답변과 서비스별 로컬 포트 이미지.
- [Auth 명세](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/develop/services/auth-service/docs/AuthDomainApiSpec.md).
- [Member 명세](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/develop/services/member-service/docs/MemberDomainApiSpec.md).
- BE가 전달한 `project-service_API_명세서.md`의 35개 엔드포인트. Notion 첨부 블록 ID는 `3d49e3e3-35cc-8064-b924-d74d56ddd7b7`이다. 만료되는 서명 다운로드 URL은 계약 링크로 저장하지 않는다.

최종 계약과 계약 변경의 기준은 **Swagger/OpenAPI**다. 인증·회원은 이번에 직접 전달받은 YAML을 최신 전달 명세로 우선한다. 이전 답변·Markdown의 보완 내용은 출처를 구분해 유지하며, YAML에 없는 API를 최신 연동 범위나 미구현으로 단정하지 않는다. 저장소 코드가 YAML보다 최신이라고 판단하거나 코드로 명세를 덮어쓰지 않는다. 불일치는 4.6에서 별도로 기록하고 BE에 연동 기준을 확인한다. 프로젝트 등 다른 서비스는 기존 근거를 유지한다.

원본 파일 식별용 SHA-256은 다음과 같다. 저장소에 YAML 원본을 복사하지 않았으며 공유 위치와 기준 버전 고정은 후속 확인 대상이다.

- `auth-api.yaml`: `127fc4d515650fb2c63249dfb130714e4f67e4157bd175a7788246db0ad891c0`.
- `member-api.yaml`: `a714da3da5281213dcd5a5c05eb21851ab08705f90605ddfb073e64c34797f20`.

| 구분           | 의미                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------- |
| 정의서 기준    | 공통 정의서의 규칙.                                                                      |
| 최신 전달 명세 | 2026-09-14 YAML에 명시된 계약. 실제 배포·호출 가능 여부는 별도 확인한다.                 |
| 코드 대조      | 특정 커밋의 소스·기존 테스트를 읽어 확인한 내용. 최신 전달 명세를 대체하지 않는다.       |
| 구현 답변 기준 | 최신 BE가 설명한 현재 구현이며 PM 정책 확정·배포 완료를 뜻하지 않는다.                   |
| 명세 보완      | 최신 답변에 없는 정보를 BE Markdown 명세로 보완했다. 실제 구현 여부까지 확정하지 않는다. |
| 미구현         | BE가 미구현이라고 답변했다.                                                              |
| 기술 확인      | Swagger·실제 응답·구현 상태로 확인할 사실 또는 누락된 계약.                              |
| 협의           | FE·BE·PM·인프라 등이 결정해야 할 정책·환경.                                              |

## 2. 환경과 경로

### 2.1. 로컬 서비스

BE는 로컬 MSA 환경을 사용하며 운영 주소는 배포 전으로 미정이다. 아래는 전달된 앱 포트를 HTTP 로컬 주소로 표현한 것이며 실제 접속 검증 결과가 아니다.

이번 Auth·Member YAML의 servers는 `/`(명세를 받아온 곳과 같은 origin)뿐이다. 이 값으로 FE에서 접근할 개발 Gateway 주소나 현재 배포 환경을 확정할 수 없으며 아래 주소는 2026-09-08 자료 기준이다.

| 서비스                   | 로컬 주소               |
| ------------------------ | ----------------------- |
| platform:gateway-service | `http://localhost:8080` |
| auth-service             | `http://localhost:8081` |
| member-service           | `http://localhost:8082` |
| project-service          | `http://localhost:8083` |
| order-service            | `http://localhost:8084` |
| payment-service          | `http://localhost:8085` |
| live-service             | `http://localhost:8086` |
| shipping-service         | `http://localhost:8087` |
| notification-service     | `http://localhost:8088` |

DB 포트 5432~5439는 FE 호출 대상이 아니다. `localhost`는 호출하는 PC를 뜻한다. FE PC에서 BE를 실행하거나 접근 가능한 BE 주소를 별도로 제공해야 한다. Gateway 포트가 있다는 것만으로 라우팅·인증 구현 완료를 가정하지 않는다.

브라우저 직접 호출/BFF 경유와 Gateway/서비스별 라우팅은 서로 다른 결정이다. FE Origin, 호출 구조, 서비스 접근 경로를 함께 정한다.

### 2.2. 경로와 버전

- URL 경로 버전 `/api/v1/...`을 사용한다.
- project-service는 `/projects/**`로 통일되지 않는다. `/rewards/**`, `/notices/**`, `/community/posts/**`, `/api/v1/ai/**`, `/sellers/**`, `/live-verifications/**`, `/admin/projects/**`도 사용한다.
- 필드 추가만으로 버전을 올리지 않으며 FE는 모르는 응답 필드를 무시해야 한다. 실제 파서에서 이 호환성을 검증해야 한다.
- 필드 삭제·이름 변경·타입 변경 등 브레이킹 체인지는 `/api/v2/...`로 병행 운영한다.
- 구버전 최소 유지 기간과 종료 공지는 팀 협의 후 확정한다.

## 3. 공통 응답과 값 표현

### 3.1. 성공 응답

도메인 DTO를 HTTP 상태 코드와 함께 별도 공통 래퍼 없이 반환한다. `data` 래퍼를 FE가 임의로 기대하지 않는다. 특정 DTO의 `message` 필드는 허용되며 공통 성공 래퍼와 구분한다. 204는 본문을 파싱하지 않는다. 개별 API의 성공 상태는 Swagger에서 확인하며 POST라는 이유만으로 201을 가정하지 않는다.

일반 로그인 `POST /api/v1/auth/login`의 성공 본문은 구현 답변 기준 다음과 같다. 소셜 로그인 응답은 4.2·4.3에서 별도로 설명한다.

```json
{
  "accessToken": "string",
  "mustChangePassword": false
}
```

페이지네이션은 다음 6개 필드다. 빈 목록도 같은 구조를 사용한다.

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "hasNext": false
}
```

### 3.2. 오류 응답

기본 필드는 문자열 `code`, 문자열 `message`, 구조가 고정되지 않은 `detail`이다. 최신 답변의 `non_null` 설정에 따라 값이 null이면 키가 생략된다. 따라서 FE에서는 `detail`의 누락과 null을 모두 처리한다. 기존 정의서의 `detail: null` 예시를 필수 키 계약으로 해석하지 않는다.

| 상황               | HTTP·코드            | detail                            |
| ------------------ | -------------------- | --------------------------------- |
| `@Valid` 검증 실패 | 400 `INVALID_INPUT`  | `[{field, reason}]` 배열.         |
| 계정 잠금          | 423 `ACCOUNT_LOCKED` | `{lockedUntil}` 객체.             |
| 그 외 현재 사례    | 해당 오류별          | null이며 응답에서 생략될 수 있다. |

```json
{
  "code": "INVALID_INPUT",
  "message": "입력값 유효성 오류 (Body 누락·JSON 형식 오류 포함)",
  "detail": [{ "field": "email", "reason": "이메일 형식이 올바르지 않습니다" }]
}
```

```json
{
  "code": "ACCOUNT_LOCKED",
  "message": "계정이 잠겨 있습니다.",
  "detail": { "lockedUntil": "2026-09-07T10:30:00Z" }
}
```

일반화된 detail 규격은 아직 없다. FE는 알 수 없는 값을 특정 배열·객체로 단정하지 않고 구조를 검사한 뒤 사용한다. 모든 400이 필드 오류 배열을 반환하는 것은 아니다. `fieldErrors`, `timestamp`, `traceId`는 전달된 표준 필드가 아니다.

이번 두 YAML은 ErrorResponse 설명에 검증 오류 배열·그 외 대부분 null을 적었지만 detail 스키마는 `type: object`만 선언한다. 배열·null 설명과 스키마가 불일치하므로 생성 타입으로 확정하지 않는다. 위 계정 잠금 detail과 null 키 생략 규칙은 2026-09-08 답변을 보존한 내용이다. YAML의 공통 코드 목록만으로 API별 발생 가능한 오류를 모두 확정하지 않으며, 실제 오류 예시와 스키마 보완이 필요하다.

### 3.3. HTTP 상태·오류 코드

| HTTP | 공통 코드 또는 의미                               |
| ---- | ------------------------------------------------- |
| 200  | 성공.                                             |
| 201  | 리소스 생성 성공.                                 |
| 204  | 성공, 본문 없음.                                  |
| 400  | `INVALID_INPUT` — Body 누락·JSON 오류·입력 오류.  |
| 401  | `UNAUTHORIZED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`. |
| 403  | `FORBIDDEN`.                                      |
| 404  | `NOT_FOUND`.                                      |
| 405  | `METHOD_NOT_ALLOWED`.                             |
| 409  | `CONFLICT`.                                       |
| 410  | `RESOURCE_EXPIRED`.                               |
| 422  | `BUSINESS_RULE_VIOLATION`.                        |
| 423  | `RESOURCE_LOCKED`.                                |
| 429  | `TOO_MANY_REQUESTS`.                              |
| 500  | `INTERNAL_ERROR`.                                 |
| 503  | `SERVICE_UNAVAILABLE`, `DEPENDENCY_FAILURE`.      |

최신 답변에서 확인한 도메인 코드는 다음과 같다. 서비스는 이 외에도 전용 코드를 추가할 수 있다.

| HTTP | 도메인 코드               | 의미                                     |
| ---- | ------------------------- | ---------------------------------------- |
| 409  | `EMAIL_ALREADY_EXISTS`    | 이메일 중복. 회원가입 토큰 소비 전 검사. |
| 423  | `ACCOUNT_LOCKED`          | 계정 잠금.                               |
| 422  | `PROJECT_NOT_DELETABLE`   | DRAFT 외 프로젝트 삭제 불가.             |
| 422  | `PROJECT_NOT_SUBMITTABLE` | 심사 제출 상태·필수 조건 불충족.         |
| 422  | `PROJECT_NOT_REVIEWABLE`  | PENDING_REVIEW 외 심사 처리 불가.        |

`TOKEN_INVALID`는 Access Token뿐 아니라 본인인증 토큰에도 쓰인다. HTTP·코드만으로 자동 갱신 또는 로그아웃하지 않고 요청 경로·용도를 함께 구분한다.

### 3.4. 날짜·ID·금액·null

| 항목               | 현재 기준                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 날짜·시간          | 최신 답변은 `Instant`의 ISO 8601 UTC 문자열(`2026-09-07T01:00:00Z`). 현재 구현 관행이며 공식 정책 확정은 아님. 기존 명세의 Z 없는 예시보다 답변을 우선한다.              |
| accountId/memberId | UUID 문자열, 두 서비스 공유 식별자.                                                                                                                                      |
| projectId          | 프로젝트 명세 보완상 외부 공개 ID는 UUID v7 문자열. 모든 프로젝트 경로에 사용하며 표시용 `projectDisplayCode`와 다르다.                                                  |
| 기타 ID            | 답변의 addressId/wishId 등은 Long. 프로젝트 명세의 rewardId/noticeId 등도 숫자 예시. Member 주소 응답의 필드명은 `id`다. 모든 서비스 ID를 한 타입으로 일반화하지 않는다. |
| 금액               | 최신 공통 답변에는 미정. 프로젝트 명세는 goalAmount/price 숫자와 원 단위를 사용한다. 공통 직렬화 타입·범위·소수 허용 정책은 별도 협의한다.                               |
| null/생략          | 응답의 null 필드는 키 생략. FE에서는 둘 다 값 없음으로 처리한다. PATCH 요청에서 생략과 명시적 null의 의미까지 같다고 확대하지 않는다.                                    |

Java Long 전체 범위는 JavaScript 안전 정수 범위를 넘을 수 있다. 숫자 ID·금액의 허용 범위와 문자열 직렬화 필요성은 연동 전 확인·협의하며 임의 변환으로 정밀도를 잃지 않는다.

null 키 생략은 오류 detail에서 추론한 규칙이 아니라 최신 BE의 공통 응답 답변을 반영한 것이다. 다만 모든 서비스·DTO의 실제 직렬화를 직접 검증한 것은 아니므로 연동 대상 응답과 대조한다. 생략/null을 모두 수용한다는 것이 모든 필드의 비즈니스 의미가 같다는 뜻은 아니다. 명세상 quantity는 isLimited=false일 때 무제한을 표현하며, remainingStock의 null은 재고 조회 실패 상황으로 설명된다. 둘을 0이나 품절로 자동 치환하지 않는다. remainingStock의 실제 실패 응답(null을 포함한 성공 응답 또는 503)은 8.1의 확인 대상으로 유지한다. 요청 quantity의 null과 PATCH 생략 의미는 응답 직렬화 규칙으로 결정하지 않는다.

## 4. 인증·회원

### 4.1. 인증 경계와 쿠키

최신 전달 명세의 보호 API는 `Authorization: Bearer <token>`을 사용한다. bearerAuth 설명은 Gateway가 토큰을 검증해 `X-User-Id`로 변환하고 클라이언트가 직접 보낸 해당 헤더는 제거한다고 명시한다. 이전 Member Markdown의 임시 `X-Account-Id` 설명을 FE 인증 계약으로 사용하지 않는다. 실제 Gateway 배포·연결은 별도 확인하며 내부 전용 헤더·키는 FE에 포함하지 않는다.

최신 YAML의 로그인 200 응답은 다음 Refresh 쿠키 속성을 명시한다. Domain·Max-Age는 이 YAML에 명시되지 않았다.

```http
Set-Cookie: refreshToken=<value>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/token/refresh
```

이전 답변·Markdown에는 가입·갱신 시 쿠키 발급과 Refresh 14일(Max-Age=1209600)이 설명돼 있으나, 이번 YAML에는 가입·갱신 응답의 Set-Cookie 정의가 없다. 갱신 요청은 본문 없이 refreshToken 쿠키를 받으며 required는 false다. 쿠키 누락 시 성공한다는 의미로 해석하지 않고 오류 응답을 확인한다. Domain·환경별 CORS·Credential은 미확정이며 이전 답변에서 CORS는 미구현이었다. FE의 직접 호출/BFF, Origin 및 Gateway 경로를 정한 후 쿠키 전달·재발급을 함께 검증한다. BFF를 쓰면 Set-Cookie 릴레이 방식도 협의한다.

호출 방식은 이번 문서에서 확정하지 않는다. 다음은 방식 선택 후 충족해야 할 전달 조건이며 현재 구현 완료를 뜻하지 않는다.

- 브라우저가 다른 Origin의 Gateway 또는 auth-service를 직접 호출해 쿠키를 발급·갱신·전송한다면 Fetch의 `credentials: "include"`가 필요하다. 서버는 허용 목록으로 검증한 요청 Origin을 `Access-Control-Allow-Origin`에 명시하고 `Access-Control-Allow-Credentials: true`를 반환해야 한다. 자격 증명 요청에 Origin 와일드카드 `*`를 사용하지 않는다. 필요한 preflight의 메소드·헤더도 허용해야 한다.
- `credentials: "include"`는 SameSite 제한을 해제하지 않는다. 제시된 `SameSite=Strict` 쿠키와 실제 FE/API의 사이트 관계가 맞는지 별도로 확인한다. 관련 브라우저 조건은 [MDN Fetch 자격 증명 설명](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#including_credentials)을 참고한다.
- BFF를 경유해 Refresh 쿠키를 브라우저에 보관하는 구조를 선택한다면 BFF의 Set-Cookie 릴레이와 갱신 요청의 쿠키 전달을 함께 정의해야 한다. 브라우저 기준 Domain·Path를 검토하며 위 Auth 예시의 Path가 BFF 경로에서도 그대로 유효하다고 가정하지 않는다. 브라우저와 BFF가 다른 Origin이면 위 CORS 조건도 적용한다. Refresh Token을 BFF 서버에만 보관하는 별도 세션 구조는 아직 합의된 계약이 아니다.

### 4.2. 주요 엔드포인트

아래는 이번 YAML에 포함된 전체 경로·메서드이며 모두 성공 상태가 200으로 기재돼 있다. 표는 핵심 필드 요약이며 전체 스키마를 대신하지 않는다. 찜 삭제는 코드와의 차이를 4.6에서 확인해야 한다.

| Method·Path                                | 요청                                                                             | 응답·설명                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| POST `/api/v1/auth/login`                  | email, password                                                                  | accessToken, mustChangePassword. 회원정보는 제외.                                                                               |
| GET `/api/v1/auth/check-email`             | query email                                                                      | available.                                                                                                                      |
| POST `/api/v1/auth/identity-verifications` | 필수 identityVerificationId, minLength 1                                         | verificationToken, expiresAt(date-time).                                                                                        |
| POST `/api/v1/auth/signup`                 | password, email, verificationToken, name, phoneNumber, agreedTerms, 선택 address | accountId, memberId, accessToken. 쿠키는 이전 근거로 분리.                                                                      |
| POST `/api/v1/auth/token/refresh`          | 본문 없음, Refresh 쿠키                                                          | accessToken. 새 쿠키는 이전 근거로 분리.                                                                                        |
| GET `/api/v1/auth/jwks`                    | 인증 불필요                                                                      | 자유 객체로 정의된 공개키 응답.                                                                                                 |
| PATCH `/api/v1/auth/password`              | currentPassword, newPassword, Access 인증                                        | message. 로그인 상태 비밀번호 변경.                                                                                             |
| GET `/api/v1/members/me`                   | 인증, 본문 없음                                                                  | memberId, name, nickname, phoneNumber, isSeller, isBuyer.                                                                       |
| GET `/api/v1/terms`                        | 인증 불필요                                                                      | code, title, content, required, version의 배열.                                                                                 |
| GET `/api/v1/addresses`                    | 인증                                                                             | id, recipientName, phoneNumber, zipcode, addressLine1, addressLine2, isDefault의 배열.                                          |
| POST `/api/v1/addresses`                   | 인증, 주소 입력                                                                  | id, recipientName, isDefault.                                                                                                   |
| PUT `/api/v1/wishes/{projectId}`           | 인증, int64 projectId, 본문 없음                                                 | projectId, wished.                                                                                                              |
| DELETE `/api/v1/wishes/{projectId}`        | 인증, int64 projectId, 본문 없음                                                 | 200, 응답 content 정의 없음.                                                                                                    |
| GET `/api/v1/wishes`                       | 인증, page 기본 0, size 기본 20                                                  | content, page, size, totalElements, totalPages, hasNext. 항목은 projectId(int64), projectTitle, projectThumbnailUrl, createdAt. |

로그인·이메일 중복 확인·일반 가입·본인인증·갱신·JWKS·약관 조회는 YAML에 인증 요구가 없다. 비밀번호 변경과 Member의 회원 조회·주소·찜 API는 bearerAuth를 명시한다.

SignupRequest의 required는 password, email, verificationToken, name, phoneNumber, agreedTerms다. 문자열은 minLength 1, email은 email 형식, agreedTerms는 문자열 배열·minItems 1이며 address는 선택 자유 객체다. nickname은 이번 YAML에 없다. PasswordChangeRequest의 두 비밀번호는 required·minLength 1이다. 로그인은 본문 자체가 필수지만 email/password의 required 목록이 없고, 응답 DTO들도 required 목록이 없어 필드의 존재 보장·null 허용을 이 파일만으로 확정하지 않는다.

다음은 **이전 Markdown 근거를 보존한 항목이며 당시 YAML에는 없는 경로**다. 이메일 찾기·재설정의 현재 계약은 아래 4.7의 BE 코드 대조로 갱신했다. 나머지 경로의 구현 상태는 이 표만으로 추정하지 않는다.

| 경로                                                           | 이전 근거와 남은 확인                                                                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| POST `/api/v1/auth/find-email`                                 | phoneNumber, verificationToken → 안내 message, 이메일은 SMS 전달 설명.                                                        |
| POST `/api/v1/auth/reset-password`                             | email → 안내 message, 재설정 링크 이메일 발송 설명.                                                                           |
| POST `/api/v1/auth/reset-password/confirm`                     | resetToken, newPassword → message, 단기·일회성 토큰 설명.                                                                     |
| POST `/api/v1/auth/login/social`, `/api/v1/auth/signup/social` | KAKAO/GOOGLE, needsSignup·signupToken 분기는 이전 명세 설명. 이번 연동 범위·최종 DTO·TTL 확인 필요.                           |
| POST `/api/v1/members`                                         | 이전 명세의 auth-service 전용 프로필 생성. YAML에 MemberCreateRequest/Response 스키마만 있다고 FE 공개 API로 취급하지 않는다. |

### 4.3. 로그인·로그아웃·비밀번호

- 일반 로그인 `POST /api/v1/auth/login`에만 최신 답변의 accessToken·mustChangePassword 두 필드 규칙을 적용한다. 이전 Auth 명세의 `member` 객체를 필수로 기대하지 않는다.
- 소셜 응답에는 일반 로그인 두 필드 규칙을 확대하지 않는다. 이전 명세의 needsSignup 분기는 참고로 유지하며 최신 연동 범위와 needsLink를 포함한 코드 차이는 4.6에서 확인한다.
- 이전 답변은 mustChangePassword가 항상 포함되지만 당시 true로 만드는 코드 경로가 없다고 설명했다. 이번 YAML의 required 누락은 보완 대상이며, 필드를 삭제하거나 영구적으로 false라고 가정하지 않는다.
- **로그아웃은 이번 YAML에 없다.** 이전 답변도 당시 미구현이라고 설명했다. FE가 Access Token을 버려도 Refresh Token 즉시 무효화나 서버 세션 종료가 된 것은 아니다. 현재 제공 여부·쿠키 만료 처리 계약은 확인 대상이다.
- 이전 답변의 Access 30분, Refresh 14일은 개발 가정값이며 PM 확정치는 아니다. 이번 YAML은 TTL을 명시하지 않는다.
- 이전 답변의 비밀번호 최소 8자·대문자/소문자/숫자/특수문자 중 3종류 이상은 개발 가정값이다. 이번 YAML의 minLength 1과 구분하고 실제 검증 규칙·최종 정책을 확인한다.
- 재설정 이메일 링크 방식은 명세 보완이다. 즉시 변경 관련 회의의 최종 사용자 흐름과 재설정 링크 FE 경로는 협의한다.
- 이전 Markdown은 Refresh Token 회전과 재사용 탐지 시 계정의 Refresh 세션 폐기를 설명했다. 이번 YAML에는 이 동작 설명이 없다. FE 갱신 요청 중복 방지와 여러 탭의 경합·실패 복구는 구현 시 검증해야 한다. 이미 발급된 Access Token까지 즉시 폐기된다고 단정하지 않는다.

### 4.4. 본인인증과 회원가입 실패

`POST /api/v1/auth/identity-verifications`는 Authorization 불필요, 성공은 **200 OK**다.

요청 본문. FE가 PortOne SDK의 인증 완료 결과에서 받은 identityVerificationId를 이 서버 검증 API에 전달한다.

```json
{ "identityVerificationId": "PortOne SDK 인증 완료 결과의 식별자" }
```

200 OK 응답 본문. BE 검증 후 발급된 verificationToken을 일반 회원가입 `POST /api/v1/auth/signup` 요청의 같은 이름 필드로 전달한다. identityVerificationId는 이 BE 응답의 필드가 아니다.

```json
{
  "verificationToken": "string",
  "expiresAt": "2026-09-07T10:30:00Z"
}
```

이하 오류·TTL·소비·재시도 규칙은 2026-09-08 답변을 보존한 내용이며 이번 YAML이 새로 명시한 계약은 아니다. 당시 답변은 인증 실패 401 TOKEN_INVALID, PortOne 연동 실패 503 DEPENDENCY_FAILURE, verificationToken 30분·1회성과 Redis get-and-delete 소비, 이름·휴대폰번호 일치 검증을 설명했다.

| 회원가입 결과                        | 최신 구현 답변 기준 FE 처리                                                                                |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 409 EMAIL_ALREADY_EXISTS             | 소비 전 중복 검사이므로 이메일을 변경해 동일 토큰으로 재시도 가능. 토큰 자체의 만료시간은 연장되지 않는다. |
| 토큰 만료·재사용·이름/휴대폰 불일치  | 모두 401 TOKEN_INVALID. 본인인증부터 재진행.                                                               |
| 그 외 서버가 실패로 응답             | 소비 이후 실패·프로필 생성 보상 트랜잭션 포함, 본인인증부터 재진행하는 기본 분기.                          |
| 네트워크 단절·타임아웃으로 결과 불명 | 서버 실패가 확정된 응답과 구분. 성공 여부 확인·재시도 계약은 기술 확인 대상으로 남긴다.                    |

이메일 예외는 모든 409가 아니라 **409 EMAIL_ALREADY_EXISTS**다. 위 본인인증/회원가입의 TOKEN_INVALID 메시지가 “Access Token 유효성 검증 실패”여도 Access 갱신을 자동 실행하지 않는다. 이 재시도 규칙은 최신 BE 답변의 일반 회원가입 범위이며 소셜 가입으로 확대하지 않는다.

### 4.5. 주소·약관

이번 Member YAML의 배송지 등록 필수값은 recipientName, phoneNumber, zipcode, addressLine1이며 모두 minLength 1이다. addressLine2·isDefault는 선택이다. isDefault 기본 false는 이전 Markdown 설명이고 YAML에 default는 없다. 주소 목록·등록 응답은 4.2를 따른다. Auth 가입 address는 자유 객체이며 Member AddressPayload에도 required가 없어 배송지 등록 규칙을 그대로 확대하지 않는다. 빈 객체·부분 입력·기본값 계약은 보완 대상이다.

회원가입 agreedTerms는 동의한 약관 코드 문자열 배열이다. Member 약관 조회의 SERVICE_USE·PRIVACY는 예시이며 전체 확정 코드 목록으로 하드코딩하지 않는다. Member 명세는 회원가입 시 구매자·판매자 권한 모두 부여한다고 명시한다. 이는 프로젝트 개인정보 동의·판매자 별도 절차와 다른 범위다. 프로젝트 약관은 최신 BE 답변상 미구현이며 별도 협의한다. 두 종류의 약관을 같은 계약으로 합치지 않는다.

### 4.6. 코드 대조와 화면 연동의 빈칸

비교 대상은 BE develop의 [931d6f80f85b84bb669e064556b7a716374365ab](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/tree/931d6f80f85b84bb669e064556b7a716374365ab)다. 코드·기존 테스트를 읽은 결과이며 테스트 실행·배포 확인 결과가 아니다. YAML의 추출 커밋이 없어 어느 쪽이 더 최신인지 단정하지 않는다. 아래 차이는 YAML을 임의로 수정하거나 코드 값을 FE 계약으로 채택할 근거가 아니다.

| 항목                | 최신 YAML                                        | 코드 대조·확인할 내용                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 회원가입 nickname   | SignupRequest에 없음.                            | [SignupRequest](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/931d6f80f85b84bb669e064556b7a716374365ab/services/auth-service/src/main/java/com/fundit/auth/presentation/dto/SignupRequest.java)는 필수·최대 50자. 연동 대상 필드 확인.                                                                                                                                                                                                                                                                                                           |
| 소셜 인증           | 경로 없음.                                       | [AuthController](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/931d6f80f85b84bb669e064556b7a716374365ab/services/auth-service/src/main/java/com/fundit/auth/presentation/controller/AuthController.java)에 login/social, signup/social, social/link가 있음. [SocialLoginResponse](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/931d6f80f85b84bb669e064556b7a716374365ab/services/auth-service/src/main/java/com/fundit/auth/presentation/dto/SocialLoginResponse.java)는 needsSignup·needsLink로 분기. 포함 여부·최종 DTO 확인. |
| 찜 삭제·페이지 범위 | DELETE 200, page 기본 0·size 기본 20, 범위 없음. | [WishController](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/931d6f80f85b84bb669e064556b7a716374365ab/services/member-service/src/main/java/com/fundit/member/presentation/controller/WishController.java)는 DELETE 204, page ≥ 0·size 1~100. 성공 상태와 검증 제약 확인.                                                                                                                                                                                                                                                                      |
| 반복 찜 등록·해제   | 반복 호출 결과 설명 없음.                        | [WishJpaRepository](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/931d6f80f85b84bb669e064556b7a716374365ab/services/member-service/src/main/java/com/fundit/member/infrastructure/persistence/wish/WishJpaRepository.java)는 중복 등록을 무시하고 없는 항목 삭제도 정상 처리. 공식 계약 반영 여부 확인.                                                                                                                                                                                                                                          |
| 가입·갱신 쿠키      | 응답 Set-Cookie 정의 없음.                       | AuthController는 가입·갱신 성공 시 쿠키를 설정. 명세 보완과 실제 환경 대조 필요.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

마이페이지의 이메일·프로필 이미지·등급·혜택은 MemberMeResponse에 없다. 찜 목록에는 판매자명·달성률·종료 상태가 없으며 판매자 팔로우 API도 이번 파일에 없다. 다른 API에서 조합할지 DTO를 확장할지 확인한다. 프로젝트 공개 UUID와 찜 int64 projectId 연결도 미정이다. 통합 검색·LIVE 알림·취소/환불/교환 내역은 담당 서비스의 별도 명세가 필요하며 Auth·Member 파일에 없다는 이유로 미구현으로 분류하지 않는다.

### 4.7. 로그인·계정 복구 코드 대조 (#217)

2026-09-20 `Fundit-backend` develop `d7ea517`의 `AuthController`, `LoginFailureHandler`, `PasswordResetService`를 확인했다. 4.2의 과거 복구 명세 대신 아래 계약을 사용한다.

| 경로                                       | 요청 → 응답                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| POST `/api/v1/auth/find-email`             | name, phoneNumber → maskedEmail. 없는 계정은 null.                             |
| POST `/api/v1/auth/find-email/reveal`      | verificationToken → email. PortOne 서버 검증 토큰을 일회 소비.                 |
| POST `/api/v1/auth/reset-password`         | name, phoneNumber, email → message. 계정 유무와 무관한 동일 안내.              |
| POST `/api/v1/auth/reset-password/confirm` | token, newPassword → message. token은 UUID이며 만료·소비 후 401 TOKEN_INVALID. |
| PATCH `/api/v1/auth/password`              | Bearer + currentPassword, newPassword → message.                               |

- 로그인 실패는 401 INVALID_CREDENTIALS, 잠금은 423 ACCOUNT_LOCKED와 detail.lockedUntil이다. FE가 실패 횟수로 잠금을 추정하지 않는다.
- `mustChangePassword`는 true도 처리하며 새 비밀번호 정책은 회원가입과 공유한다.
- 재설정 메일 기본·개발 링크는 `/reset-password?token=%s`다. 운영 URL 템플릿·실제 메일 발송·PortOne 채널/복구 콜백은 BE/인프라 확인 대상으로 남긴다.
- FE 검증은 HTTP 대역과 독립 브라우저 기준이며 운영 외부 인증·메일 수신 성공을 의미하지 않는다.

## 5. 프로젝트

### 5.1. 상태·수정·제출

enum은 DRAFT, PENDING_REVIEW, ONGOING, SUCCEEDED, FAILED다.

| 동작       | 최신 구현 답변 기준                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 제출       | DRAFT → PENDING_REVIEW. 기본정보(사업자유형·카테고리·제목·목표금액), 소개 콘텐츠, 리워드 1개 이상, 개인정보 동의가 모두 필요. 불충족은 422 PROJECT_NOT_SUBMITTABLE. |
| 승인       | PENDING_REVIEW → ONGOING.                                                                                                                                           |
| 반려       | PENDING_REVIEW → DRAFT, 재제출 가능.                                                                                                                                |
| 심사 불가  | PENDING_REVIEW 외에는 422 PROJECT_NOT_REVIEWABLE.                                                                                                                   |
| 삭제       | DRAFT만 가능. 나머지는 422 PROJECT_NOT_DELETABLE.                                                                                                                   |
| 그 외 수정 | 기본정보·소개·리워드·고시·환불정책은 현재 프로젝트 상태와 무관하게 호출 가능. 허용 정책이 확정됐다는 의미는 아님.                                                   |

진행 중 목표금액·가격 수정도 현재 서버가 막지 않는다. FE 비활성화만으로 보안을 대신하지 않으며 상태별 허용 필드와 BE 검증을 협의한다. ONGOING에서 SUCCEEDED/FAILED로 전환하는 시점·주체는 전달된 답변으로 확정하지 않는다.

### 5.2. 작성 흐름·주요 경로

다음은 프로젝트 명세 보완이다.

| 동작             | Method·Path                                               | 핵심 계약                                                                      |
| ---------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 목록             | GET `/api/v1/projects`                                    | 판매자 본인 목록, 선택 status와 page/size. status 미지정은 전체.               |
| 신규 생성        | POST `/api/v1/projects`                                   | 본문 없음 → projectId(UUID v7), status=DRAFT.                                  |
| 기본정보         | PATCH `/api/v1/projects/{projectId}/basic-info`           | businessType, categoryMajor, categoryMinor, title, goalAmount 부분 갱신.       |
| 개인정보 동의    | POST `/api/v1/projects/{projectId}/privacy-consent`       | agreed. 프로젝트 약관 코드 목록과 별개.                                        |
| 소개             | PATCH `/api/v1/projects/{projectId}/story`                | title, coverImageUrl, introContent.                                            |
| 리워드 등록      | POST `/api/v1/projects/{projectId}/rewards`               | name, description, imageUrl, price, isLimited, quantity, isEarlyBird, options. |
| 리워드 수정/삭제 | PATCH/DELETE `/api/v1/rewards/{rewardId}`                 | 수정은 부분 필드, 삭제 성공은 본문 없는 204.                                   |
| 고시             | PUT `/api/v1/rewards/{rewardId}/disclosure`               | categoryType, disclosure.                                                      |
| 환불 특이사항    | PATCH `/api/v1/rewards/{rewardId}/refund-policy`          | simpleRefundDisabled.                                                          |
| 제출             | POST `/api/v1/projects/{projectId}/submit`                | 본문 없음. 최신 조건·오류는 5.1 적용.                                          |
| 관리자 심사      | POST `/api/v1/admin/projects/{projectId}/review-decision` | decision(APPROVED/REJECTED), 반려 시 rejectReason.                             |
| 판매자 미리보기  | GET `/api/v1/projects/{projectId}/preview`                | 본인 미공개 프로젝트 조회용.                                                   |
| 공개 상세        | GET `/api/v1/projects/{projectId}`                        | 미공개 DRAFT/PENDING_REVIEW는 404.                                             |

명세상 DRAFT를 먼저 생성하고 해당 ID로 개별 작성 API를 호출한다. FE의 현재 /new 화면 저장 목업이 실제 API 호출 순서를 구현한 것은 아니다.

기본정보 명세는 제목 40자, goalAmount 최소 500,000원, 등록된 카테고리 조합을 요구한다. businessType은 SOLE 예시만 있어 전체 enum을 추측하지 않는다. 카테고리 표시 문자열·공백도 저장 계약과 구분한다.

리워드 명세에서 isLimited=true이면 quantity는 0 이상, false이면 null이다. options는 `[{groupName, values: string[]}]`이며 현재 목업의 options 체크값과 다르다. 명세 보완값은 Swagger로 대조한 후 연동한다. PATCH에서 수량 제한 해제 시 null과 생략의 갱신 의미도 확인한다.

### 5.3. 콘텐츠·업로드

- introContent는 최신 답변 기준 순서 있는 평면 배열 `[{type: "TEXT" | "IMAGE" | "VIDEO_URL", value: "..."}]`이다. 이전 자유형 Map 설명을 폐기한다.
- disclosure는 `Map<String,String>`이며 현재 카테고리별 필수 키 검증은 없다. 필수 키 목록을 FE·BE가 협의해 BE 검증에 반영한다.
- 프로젝트 약관은 미구현이며 기존 agreedTerms의 비어 있지 않음 검사 설명을 최종 프로젝트 동의 규격으로 사용하지 않는다.
- 이미지·영상은 업로드 완료 URL을 받아 저장하는 상태다. 실제 업로드 방식·제한은 인프라 협의 전이며 명세의 10MB·확장자 검증을 구현 완료로 기록하지 않는다.
- 현재 리치 텍스트/HTML 및 base64 목업을 introContent·업로드 URL 계약으로 변환하는 규칙이 필요하다. TEXT에서 서식·HTML을 어떻게 표현할지 별도 협의하며 임의 HTML 실행을 허용하지 않는다.

### 5.4. 페이지네이션·기타 조회

프로젝트 목록·새소식 목록(#17)·새소식 댓글(#19)·커뮤니티 게시글(#21)은 content, page, size, totalElements, totalPages, hasNext를 모두 반환한다. page는 0부터, 기본 size는 20이며 현재 최대 size 제한은 없다.

LIVE검증 조회(#33) `GET /api/v1/projects/{projectId}/live-verifications`는 페이지 정보 없이 `{content: [...]}`만 반환한다. 기타 리워드/고시 조회처럼 단순 배열인 API까지 페이지 래퍼로 강제하지 않는다.

명세상 프로젝트 목록 status 필터는 단일 enum이다. FE 준비중/진행중/종료 탭을 서버 페이지 일부에서만 필터링하면 건수·목록이 틀릴 수 있으므로 상태 그룹별 조회·페이지 처리 방식은 연동 시 정한다.

### 5.5. AI 스토리

모든 공개 요청은 `X-Project-Id: <project UUID>`를 포함하고 `/api/v1/ai`를 사용한다.

| 동작        | Method·Path                                     |
| ----------- | ----------------------------------------------- |
| 최신 세션   | GET `/api/v1/ai/sessions/latest`                |
| 세션 생성   | POST `/api/v1/ai/sessions` + `{}`               |
| 세션 조회   | GET `/api/v1/ai/sessions/{sessionId}`           |
| 첫 질문     | POST `/api/v1/ai/sessions/{sessionId}/start`    |
| 메시지      | POST `/api/v1/ai/sessions/{sessionId}/messages` |
| 채팅 스트림 | GET `/api/v1/ai/chats/{chatId}/events` (SSE)    |
| 요약 확인   | POST `/api/v1/ai/sessions/{sessionId}/confirm`  |
| 전체 생성   | POST `/api/v1/ai/runs`                          |
| 상태·결과   | GET `/api/v1/ai/runs/{runId}`                   |

- FE는 Core 프로젝트·리워드 DTO를 만들지 않는다. BE가 최신 Core 사실을 AI 요청에 추가한다.
- 메시지는 `message_id`, 현재 `revision`, `text`를 보내며 SSE `message`·`done`을 처리한다.
- 전체 생성은 `session_id`, `confirmed_revision`, 새 `idempotency_key`만 보낸다. 부분 재생성 API는 없다.
- run 상태는 `queued|running|succeeded|partially_succeeded|failed`다. 부분 성공도 `result`를 표시·불러오고 실패 슬롯을 안내한다.
- 완료 callback 시 BE가 검증된 결과를 프로젝트에 저장한다. 별도 export/apply API는 없으며 FE의 “불러오기”는 현재 에디터와 캐시를 BE 결과에 맞춘다.
- 확인 뒤 Core 정보가 바뀐 `409`의 `detail.action=reconfirm_summary`는 새 요약 확인이 필요한 상태다.

## 6. 최신 답변으로 정리한 차이

아래 표는 2026-09-08 답변으로 정리했던 차이를 보존한다. 2026-09-14 인증·회원 YAML 반영 내용과 코드 불일치는 4장이 우선한다.

| 기존 자료                               | 이번 초안 기준                                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 로그인 member 객체 포함 예시            | 최신 답변의 accessToken·mustChangePassword만 사용.                                                                   |
| 날짜 Z 누락·null 키 존재 예시           | 현재 구현 답변의 UTC·null 키 생략 적용.                                                                              |
| 모든 로컬 리소스 ID는 Long이라는 일반화 | 회원 답변의 범위와 프로젝트 공개 UUID를 구분. Member 찜의 숫자 projectId 예시도 프로젝트 UUID 명세와 연동 대조 필요. |
| 제출 400/422 혼재·삭제 공통 오류        | 최신 프로젝트 전용 422 코드 적용.                                                                                    |
| 제출 필수값에 환불 특이사항 포함        | 최신 BE 답변의 5.1 조건 적용.                                                                                        |
| 고시 템플릿 검증·업로드 제한 구현 서술  | 현재 고시 검증 없음·URL 저장만 구현으로 정정.                                                                        |
| MSW 허용 여부·최종 기준 미정            | 합의한 임시 명세 기반 MSW 허용, 최종 기준 Swagger.                                                                   |

## 7. MSW·변경 관리

미구현 API도 **합의한 임시 명세**를 기준으로 MSW 선작성이 가능하다는 BE 답변을 받았다. 누락된 계약을 FE가 임의 확정해도 된다는 뜻은 아니다. 정상·대표 오류·빈 목록·204·detail 생략을 포함하고 실제 계약과 임시 목업을 구분한다.

최종 계약 및 변경 기준은 Swagger다. 이 Markdown은 근거·현재 구현·연동 준비를 정리한 보조 문서이며 Swagger를 대체하지 않는다. Swagger 갱신 책임·변경 알림 채널·목업 동기화 절차는 팀 협의로 정한다. 코드·MSW·환경변수는 이번 문서 갱신에서 변경하지 않는다.

## 8. 남은 항목

이미 답변된 로그인 본문·본인인증 상태·이전 만료시간 가정값·프로젝트 오류 등을 처음부터 다시 묻지 않는다. 최신 YAML에 반영된 항목은 완료로 구분하되, 아래 명세 불일치·누락·정책 최종 확정만 해당 기능 연동 전에 확인한다.

### 8.1. 기술 확인

| 항목                | 확인할 내용                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 기준·접근·구현 상태 | YAML 기준 커밋·추출 시점, 제외된 API와 일정, 개발 Gateway 주소·배포 버전·테스트 계정/데이터. 인증 방식은 YAML의 Bearer 기준이며 실제 연결은 확인 필요.         |
| 인증·회원 DTO       | 4.6의 nickname·소셜·찜 삭제/페이지 범위 불일치, 가입 address 내부 구조, 요청·응답 required/null·기본값, 가입·갱신 Set-Cookie 정의.                             |
| 오류 계약           | detail 설명과 object 스키마 불일치, API별 HTTP 상태·도메인 코드·대표 오류 응답 보완.                                                                           |
| 화면 데이터         | 회원 이메일·이미지·등급·혜택, 찜 목록 판매자·달성률·종료 상태의 제공 API, 팔로우 목록·등록·해제와 목록 정렬 기준. 검색·LIVE 알림·환불 내역의 별도 서비스 명세. |
| 프로젝트 DTO 보완   | businessType 전체 enum·카테고리 조회 방식, 성공 상태와 PATCH null 의미.                                                                                        |
| 교차 서비스 ID      | 프로젝트 UUID와 Member 찜의 숫자 projectId 예시 연결, Long JSON 범위.                                                                                          |
| AI 세부 계약        | 추가 질문·답변 제출·오류/재시도 필드 및 실제 구현 여부.                                                                                                        |
| 결과 불명 복구      | 가입·생성 등 요청 타임아웃 시 성공 여부 확인·중복 방지 방법.                                                                                                   |
| 재고 조회 실패      | 프로젝트 명세의 remainingStock null 정상 응답과 503 오류 중 실제 응답.                                                                                         |
| 계정 복구·소셜      | 계정 복구 계약은 4.7에서 코드 확인. 실제 메일·PortOne 설정 검증, 소셜 인증의 연동 범위·일정·TTL 확인.                                                          |

### 8.2. 정책·환경 협의

| 항목          | 협의 내용                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------- |
| 호출 구조     | 직접 호출/BFF, Gateway/서비스별 호출, FE Origin, CORS·Credential·쿠키 설정.                     |
| 인증 정책     | 로그아웃·Refresh 무효화, Access/Refresh TTL·비밀번호 개발 가정값의 PM 확정, 재설정 사용자 흐름. |
| 프로젝트 상태 | 진행 중 수정 가능 필드·가격·리워드 삭제 및 서버 검증, 종료 상태 전환.                           |
| 동의·고시     | 프로젝트 약관·개인정보 동의의 관계, 카테고리별 고시 필수 키.                                    |
| 업로드·콘텐츠 | 업로드 절차·용량·확장자, 리치 텍스트와 introContent 변환 및 URL 저장.                           |
| 금액·ID 표현  | 통화·단위·소수·허용 범위 및 안전한 직렬화.                                                      |
| 운영          | 구버전 유지 기간, Swagger 갱신·변경 공유·MSW 동기화 절차.                                       |

남은 항목 전체가 완료되어야 문서나 와이어프레임 작업을 진행할 수 있는 것은 아니다. 실제 연동 대상 기능에 필요한 항목부터 확인·협의한다.

### 새 소식 입력 검증

새 소식 제목은 제출 전에 공백을 제거해 필수값을 검사한다. 제목이 비어 있으면 등록 버튼과 제출 처리를 막되, 안내는 폼 입력을 변경하거나 제출을 시도한 뒤에 표시한다. 처음 진입하거나 등록에 성공해 입력이 초기화되면 경고를 표시하지 않는다. 본문은 기존 필수 검증을 유지한다.
