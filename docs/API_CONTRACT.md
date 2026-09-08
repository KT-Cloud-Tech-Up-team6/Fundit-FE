# API 계약 초안

작성일은 2026-09-07, 갱신일은 2026-09-08이며 FE·BE 연동 준비용 초안이다. 관련 작업은 [#47](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/47)이다.

## 1. 목적·근거·우선순위

이 문서는 백엔드 코드·실제 서버 응답을 직접 검증한 결과가 아니라 전달받은 자료를 정리한 문서다.

- API 버저닝·표준 에러 형식 정의서.
- 2026-09-08 FE에 전달된 최신 BE 추가 답변과 서비스별 로컬 포트 이미지.
- [Auth 명세](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/develop/services/auth-service/docs/AuthDomainApiSpec.md).
- [Member 명세](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-backend/blob/develop/services/member-service/docs/MemberDomainApiSpec.md).
- BE가 전달한 `project-service_API_명세서.md`의 35개 엔드포인트. Notion 첨부 블록 ID는 `3d49e3e3-35cc-8064-b924-d74d56ddd7b7`이다. 만료되는 서명 다운로드 URL은 계약 링크로 저장하지 않는다.

최종 계약과 계약 변경의 기준은 **Swagger**다. 이번 초안 갱신에서는 사용자 지시에 따라 기존 Markdown 명세와 충돌하는 **최신 BE 답변을 우선**하고, 답변에 없는 경로·필드를 명세로 보완한다. Swagger 주소와 실제 응답을 확보하면 연동 대상부터 대조한다. 답변이 있는 항목을 재질문하거나 모든 협의가 끝날 때까지 초안 갱신을 미루지 않는다.

| 구분           | 의미                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------- |
| 정의서 기준    | 공통 정의서의 규칙.                                                                      |
| 구현 답변 기준 | 최신 BE가 설명한 현재 구현이며 PM 정책 확정·배포 완료를 뜻하지 않는다.                   |
| 명세 보완      | 최신 답변에 없는 정보를 BE Markdown 명세로 보완했다. 실제 구현 여부까지 확정하지 않는다. |
| 미구현         | BE가 미구현이라고 답변했다.                                                              |
| 기술 확인      | Swagger·실제 응답·구현 상태로 확인할 사실 또는 누락된 계약.                              |
| 협의           | FE·BE·PM·인프라 등이 결정해야 할 정책·환경.                                              |

## 2. 환경과 경로

### 2.1. 로컬 서비스

BE는 로컬 MSA 환경을 사용하며 운영 주소는 배포 전으로 미정이다. 아래는 전달된 앱 포트를 HTTP 로컬 주소로 표현한 것이며 실제 접속 검증 결과가 아니다.

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
- project-service는 `/projects/**`로 통일되지 않는다. `/rewards/**`, `/notices/**`, `/community/posts/**`, `/ai/funding-story/sessions/**`, `/sellers/**`, `/live-verifications/**`, `/admin/projects/**`도 사용한다.
- 필드 추가만으로 버전을 올리지 않으며 FE는 모르는 응답 필드를 무시해야 한다. 실제 파서에서 이 호환성을 검증해야 한다.
- 필드 삭제·이름 변경·타입 변경 등 브레이킹 체인지는 `/api/v2/...`로 병행 운영한다.
- 구버전 최소 유지 기간과 종료 공지는 팀 협의 후 확정한다.

## 3. 공통 응답과 값 표현

### 3.1. 성공 응답

도메인 DTO를 HTTP 상태 코드와 함께 별도 공통 래퍼 없이 반환한다. `data` 래퍼를 FE가 임의로 기대하지 않는다. 특정 DTO의 `message` 필드는 허용되며 공통 성공 래퍼와 구분한다. 204는 본문을 파싱하지 않는다. 개별 API의 성공 상태는 Swagger에서 확인하며 POST라는 이유만으로 201을 가정하지 않는다.

로그인 성공 본문은 구현 답변 기준 다음과 같다.

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

## 4. 인증·회원

### 4.1. 인증 경계와 쿠키

Auth의 Access Token 전달은 `Authorization: Bearer <token>`이다. 프로젝트 명세도 같은 헤더를 지정한다. Member 명세는 아직 `X-Account-Id`를 서명 검증 없이 신뢰하는 내부망 전제의 임시 방식이라고 명시한다. 이를 운영용 FE 인증 계약으로 채택하지 않고 Gateway 인증 연결 상태를 먼저 확인한다. 내부 전용 키는 FE에 포함하지 않는다.

Auth 명세 보완상 로그인·회원가입·갱신 시 Refresh Token은 다음 쿠키로 전달하며 응답 본문에 포함하지 않는다.

```http
Set-Cookie: refreshToken=<value>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/token/refresh; Max-Age=1209600
```

최신 답변도 HttpOnly·Secure·SameSite=Strict 예시를 제공했다. Domain·환경별 CORS·Credential은 미확정이며 이전 답변에서 CORS는 미구현이었다. FE의 직접 호출/BFF, Origin 및 Gateway 경로를 정한 후 쿠키 Path·전달·재발급을 함께 검증한다. BFF를 쓰면 Set-Cookie 릴레이 방식도 협의한다.

### 4.2. 주요 엔드포인트

아래 경로와 본문은 명세 보완이며 최신 답변과 충돌하는 로그인 응답 등은 정정했다. 표의 본문은 핵심 필드 요약이며 전체 Swagger 스키마를 대신하지 않는다.

| Method·Path                                | 요청                                                                             | 응답·설명                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| POST `/api/v1/auth/login`                  | email, password                                                                  | accessToken, mustChangePassword. 회원정보는 제외.         |
| GET `/api/v1/auth/check-email`             | query email                                                                      | available.                                                |
| POST `/api/v1/auth/signup`                 | password, email, verificationToken, name, phoneNumber, agreedTerms, 선택 address | accountId, memberId, accessToken 및 Refresh 쿠키.         |
| POST `/api/v1/auth/token/refresh`          | 본문 없음, Refresh 쿠키                                                          | accessToken 및 새 Refresh 쿠키.                           |
| POST `/api/v1/auth/find-email`             | phoneNumber, verificationToken                                                   | 안내 message. 이메일은 응답이 아니라 SMS로 전달하는 명세. |
| POST `/api/v1/auth/reset-password`         | email                                                                            | 안내 message, 재설정 링크 이메일 발송.                    |
| POST `/api/v1/auth/reset-password/confirm` | resetToken, newPassword                                                          | message. 단기·일회성 재설정 토큰 사용.                    |
| PATCH `/api/v1/auth/password`              | currentPassword, newPassword, Access 인증                                        | message. 로그인 상태 비밀번호 변경.                       |
| GET `/api/v1/members/me`                   | 인증, 본문 없음                                                                  | memberId, name, nickname, phoneNumber, isSeller, isBuyer. |
| GET `/api/v1/terms`                        | 인증 불필요                                                                      | code, title, content, required, version의 배열.           |
| GET/POST `/api/v1/addresses`               | 인증                                                                             | 배송지 목록/등록.                                         |
| PUT/DELETE `/api/v1/wishes/{projectId}`    | 인증, 본문 없음                                                                  | 찜 등록/해제. 삭제는 204.                                 |
| GET `/api/v1/wishes`                       | 인증, page/size                                                                  | 공통 6개 필드 페이지 응답.                                |

회원 프로필 생성 `POST /api/v1/members`는 auth-service 전용이며 FE가 직접 호출하지 않는다.

Auth 명세에는 소셜 로그인 `POST /api/v1/auth/login/social`과 소셜 가입 `POST /api/v1/auth/signup/social`도 있다. provider는 KAKAO/GOOGLE, 미가입 로그인은 200의 `needsSignup: true`와 `signupToken`으로 가입을 이어가는 명세다. 소셜 로그인 예시의 member 포함 여부 및 Member 소셜 생성의 MVP 제외 표기는 최신 실제 구현과 대조해야 한다. signupToken의 “예: 10분”은 확정 TTL로 취급하지 않는다.

### 4.3. 로그인·로그아웃·비밀번호

- 로그인은 최신 답변의 두 필드만 사용한다. 이전 Auth 명세의 `member` 객체를 필수로 기대하지 않는다.
- `mustChangePassword`는 항상 포함되지만 현재 true로 만드는 코드 경로가 없다. 필드 자체를 삭제하거나 영구적으로 false라고 가정하지 않는다.
- **로그아웃은 스펙·코드에 없다.** FE가 Access Token을 버려도 Refresh Token 즉시 무효화나 서버 세션 종료가 된 것은 아니다. 실제 로그아웃 동작·쿠키 만료 처리 계약은 협의 대상이다.
- Access 30분, Refresh 14일은 적용된 개발 가정값이며 PM 확정치는 아니다.
- 비밀번호는 최소 8자이며 대문자·소문자·숫자·특수문자 중 3종류 이상이다. 이 역시 개발 가정값이며 최종 정책은 협의한다.
- 재설정 이메일 링크 방식은 명세 보완이다. 즉시 변경 관련 회의의 최종 사용자 흐름과 재설정 링크 FE 경로는 협의한다.
- 명세상 Refresh Token은 회전하며 재사용 탐지 시 계정의 Refresh 세션들을 폐기한다. FE 갱신 요청 중복 방지와 여러 탭의 경합·실패 복구는 구현 시 검증해야 한다. 이미 발급된 Access Token까지 즉시 폐기된다고 단정하지 않는다.

### 4.4. 본인인증과 회원가입 실패

`POST /api/v1/auth/identity-verifications`는 Authorization 불필요, 성공은 **200 OK**다.

```json
{ "identityVerificationId": "PortOne SDK 인증 완료 결과의 식별자" }
```

```json
{
  "verificationToken": "string",
  "expiresAt": "2026-09-07T10:30:00Z"
}
```

인증 실패는 401 TOKEN_INVALID, PortOne 연동 실패는 503 DEPENDENCY_FAILURE다. 회원가입에 넘기는 verificationToken은 30분·1회성이며 Redis get-and-delete로 소비된다. 이름·휴대폰번호 일치도 검증한다.

| 회원가입 결과                        | 최신 구현 답변 기준 FE 처리                                                                                |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 409 EMAIL_ALREADY_EXISTS             | 소비 전 중복 검사이므로 이메일을 변경해 동일 토큰으로 재시도 가능. 토큰 자체의 만료시간은 연장되지 않는다. |
| 토큰 만료·재사용·이름/휴대폰 불일치  | 모두 401 TOKEN_INVALID. 본인인증부터 재진행.                                                               |
| 그 외 서버가 실패로 응답             | 소비 이후 실패·프로필 생성 보상 트랜잭션 포함, 본인인증부터 재진행하는 기본 분기.                          |
| 네트워크 단절·타임아웃으로 결과 불명 | 서버 실패가 확정된 응답과 구분. 성공 여부 확인·재시도 계약은 기술 확인 대상으로 남긴다.                    |

이메일 예외는 모든 409가 아니라 **409 EMAIL_ALREADY_EXISTS**다. 위 본인인증/회원가입의 TOKEN_INVALID 메시지가 “Access Token 유효성 검증 실패”여도 Access 갱신을 자동 실행하지 않는다. 이 재시도 규칙은 최신 BE 답변의 일반 회원가입 범위이며 소셜 가입으로 확대하지 않는다.

### 4.5. 주소·약관

Member 명세상 배송지 등록 필수값은 recipientName, phoneNumber, zipcode, addressLine1이며 addressLine2·isDefault는 선택, isDefault 기본값은 false다. 목록은 id와 주소 필드를 반환한다. 가입 요청의 선택 address 내부 필수값이 배송지 등록과 완전히 같은지는 Swagger의 해당 DTO로 확인한다.

회원가입 agreedTerms는 동의한 약관 코드 문자열 배열이다. Member 약관 조회의 SERVICE_USE·PRIVACY는 예시이며 전체 확정 코드 목록으로 하드코딩하지 않는다. Member 명세는 회원가입 시 구매자·판매자 권한 모두 부여한다고 명시한다. 이는 프로젝트 개인정보 동의·판매자 별도 절차와 다른 범위다. 프로젝트 약관은 최신 BE 답변상 미구현이며 별도 협의한다. 두 종류의 약관을 같은 계약으로 합치지 않는다.

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

명세에는 아래 API가 있으나 실제 AI 연동 완료를 뜻하지 않는다.

| 동작 | Method·Path                                                   |
| ---- | ------------------------------------------------------------- |
| 생성 | POST `/api/v1/projects/{projectId}/ai/funding-story/sessions` |
| 조회 | GET `/api/v1/ai/funding-story/sessions/{sessionId}`           |
| 반영 | PATCH `/api/v1/ai/funding-story/sessions/{sessionId}/apply`   |

생성 요청은 productDescription, productImageUrls, answers의 questionId/answer이며 응답 예시는 sessionId·GENERATING 상태다. 조회는 GENERATING/COMPLETED/FAILED와 additionalQuestions·result를 설명하지만 질문 스키마, 후속 답변 제출, 재시도 플래그·오류·폴링 주기 계약이 충분하지 않다. 생성된 result.sections와 introContent는 다른 구조이며 변환을 추측하지 않는다.

apply는 mode(OVERWRITE/COPY), edits를 받고 스토리에 임시저장하는 명세다. 현재 FE의 “불러오기”는 로컬 반영뿐이므로 서버 저장과 같은 동작으로 설명하지 않는다.

## 6. 최신 답변으로 정리한 차이

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

이미 답변된 로그인 본문·detail·본인인증 상태·만료시간·프로젝트 오류 등을 다시 묻지 않는다. 먼저 Swagger에서 확인하고 없는 내용만 해당 기능 연동 전에 질문한다.

### 8.1. 기술 확인

| 항목           | 확인할 내용                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| 접근·구현 상태 | Swagger 접근 주소, 현재 호출 가능한 API, Gateway 라우팅·Member 인증 연결 상태. 운영 URL은 배포 전 미정으로 유지. |
| DTO 보완       | businessType 전체 enum·카테고리 조회 방식, 가입 address 스키마, API별 성공 상태와 PATCH null 의미.               |
| 교차 서비스 ID | 프로젝트 UUID와 Member 찜의 숫자 projectId 예시 연결, Long JSON 범위.                                            |
| AI 세부 계약   | 추가 질문·답변 제출·오류/재시도 필드 및 실제 구현 여부.                                                          |
| 결과 불명 복구 | 가입·생성 등 요청 타임아웃 시 성공 여부 확인·중복 방지 방법.                                                     |
| 재고 조회 실패 | 프로젝트 명세의 remainingStock null 정상 응답과 503 오류 중 실제 응답.                                           |
| 소셜 가입      | Auth 명세와 Member MVP 제외 설명의 연결·실제 지원 범위 및 signupToken TTL.                                       |

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
