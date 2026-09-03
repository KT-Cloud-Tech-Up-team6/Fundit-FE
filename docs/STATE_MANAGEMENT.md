# 상태 관리 전략

결정 상태는 승인됨이며 결정일은 2026-09-03입니다. API 계약 또는 런타임 요구사항이 달라지면 이 문서의 재검토 조건에 따라 갱신합니다.

## 결정

상태 관리 전략은 아래 조합으로 확정합니다.

- URL로 복원돼야 하는 상태는 App Router의 `params`와 `searchParams`가 소유합니다.
- 서버에서만 읽는 데이터는 Server Component와 Next.js `fetch`가 소유합니다.
- 클라이언트에서 캐시·재조회·mutation 조정이 필요한 서버 상태는 TanStack Query가 소유합니다.
- 한 기능 안에서 끝나는 UI와 폼 상태는 React `useState` 또는 `useReducer`가 소유합니다.
- 인증 사용자 요약과 테마처럼 제한된 공유 값만 React Context로 제공합니다.
- Zustand와 Redux Toolkit은 현재 도입하지 않습니다.

TanStack Query는 도구로 선정했지만 아직 설치하지 않습니다. 첫 API 계약과 MSW handler가 확정되는 기능에서 함께 도입해 사용하지 않는 전역 Provider와 의존성이 먼저 생기지 않게 합니다.

## 선택 배경

현재 코드는 Server Component를 기본으로 사용하고 로그인·회원가입 화면의 일시적인 입력과 표시 상태만 컴포넌트에 보관합니다. 반면 실제 API 연동이 시작되면 프로젝트, 펀딩, 배송, 환불, 알림과 결제 결과에서 캐시 무효화와 재조회가 필요하고, 찜과 채팅에는 optimistic update가 필요할 수 있습니다.

이 요구를 하나의 전역 store로 합치면 서버 응답의 원본, URL, 입력 중인 값이 중복됩니다. 상태의 성격에 따라 소유자를 나누고, TanStack Query는 클라이언트가 소비하는 서버 상태에만 사용합니다.

## 상태 분류와 소유권

| 상태 종류            | 단일 원본                  | 저장 위치                       | 적용 예시                                           |
| -------------------- | -------------------------- | ------------------------------- | --------------------------------------------------- |
| 경로 상태            | URL                        | `params`, `searchParams`        | 프로젝트 탭, LIVE 모드, 목록 상태·페이지, 환불 유형 |
| 서버 전용 조회       | 서버 응답                  | Server Component와 Next.js 캐시 | 공개 상세의 SEO 데이터, 최초 렌더링 전용 데이터     |
| 클라이언트 서버 상태 | 서버 응답                  | TanStack Query Cache            | 목록 재조회, 찜, 알림, 배송·환불 상태, 결제 결과    |
| 기능 UI 상태         | 해당 기능 컴포넌트         | `useState`, `useReducer`        | 모달, 시트, 토스트, 제출 중 표시                    |
| 폼 draft             | 해당 form boundary         | React 상태                      | 회원가입 정보, 배송지, 환불 신청, 프로젝트 작성     |
| 제한적 공유 상태     | 서버 세션 또는 사용자 설정 | 좁은 React Context              | 공개 가능한 사용자 요약, 현재 모드, 테마            |
| 실시간 연결 상태     | LIVE·채팅 adapter          | 해당 LIVE 기능 경계             | 연결·재연결, 송수신 상태, 마지막 처리 이벤트        |
| 실시간 도메인 상태   | 서버 snapshot              | Query Cache 또는 기능 상태      | 방송 상태, 펀딩 수치, 채팅 메시지                   |
| 보안·권한 상태       | 서버                       | 서버 세션                       | 인증 토큰, 판매자 동의, 리소스 소유권               |

브라우저 저장소에는 인증 토큰, 결제 상태, 주문 정보와 권한 판정값을 저장하지 않습니다. 테마처럼 유출과 변조가 업무 상태에 영향을 주지 않는 사용자 설정만 저장 후보로 둡니다.

## 도구 비교

| 후보                               | 판단 | 근거                                                                                                                                                                 |
| ---------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React 상태와 Context               | 사용 | 로컬 UI와 제한된 공유 값에 충분하고 현재 코드와 일치합니다. Context는 서버 상태 캐시로 사용하지 않습니다.                                                            |
| Next.js Server Component와 `fetch` | 사용 | 서버 전용 조회, 비밀값 보호, 클라이언트 JavaScript 절감에 적합합니다.                                                                                                |
| TanStack Query                     | 선택 | 클라이언트 서버 상태의 캐시, 중복 요청 제거, mutation, 재조회와 optimistic update를 일관되게 관리할 수 있습니다.                                                     |
| Zustand                            | 보류 | 현재 확인된 상태는 URL·서버·기능 로컬 상태로 분류할 수 있어 별도 전역 store의 이점이 없습니다. Next.js에서는 요청별 store와 hydration 경계도 추가로 관리해야 합니다. |
| Redux Toolkit                      | 제외 | 현재 MVP에는 전역 이벤트 감사, 복잡한 middleware와 대규모 클라이언트 상태 전이가 필요하지 않습니다.                                                                  |

## Next.js 캐시와 Query Cache 경계

같은 리소스를 두 캐시가 독립적으로 소유하지 않게 아래 기준을 적용합니다.

1. 렌더링 후 클라이언트 재조회나 mutation이 없으면 Server Component에서 조회합니다.
2. polling, 사용자 mutation, optimistic update 또는 포커스 복귀 재조회가 필요하면 TanStack Query가 소유합니다.
3. SEO용 최초 데이터와 클라이언트 상호작용이 모두 필요할 때만 서버 prefetch와 hydration을 사용합니다.
4. hydration을 사용하면 Query Key와 stale 정책까지 동일한 query 정의를 공유합니다.
5. Server Component가 같은 데이터를 별도 `fetch`하고 Client Component가 다시 query하는 구조를 만들지 않습니다.

Provider는 필요한 Client Component 경계만 감쌉니다. 루트 `AppProviders`에 연결하더라도 Query Client는 브라우저 수명 동안 한 번 생성하고 서버 요청 간 singleton으로 공유하지 않습니다.

## Query 규칙

Query 정의는 데이터를 사용하는 `features/<feature>`가 소유하고 HTTP client와 공통 오류 변환만 `shared/lib`에 둡니다.

```ts
const projectKeys = {
  all: ["projects"] as const,
  list: (filters: ProjectListFilters) => [...projectKeys.all, "list", filters] as const,
  detail: (projectId: string) => [...projectKeys.all, "detail", projectId] as const,
};
```

- Query Key는 직렬화 가능한 배열이며 도메인, 리소스 종류, 식별자·필터 순서로 작성합니다.
- 화면 컴포넌트에서 임의 문자열 키를 만들지 않습니다.
- 서버 응답 객체를 별도 전역 store에 복사하지 않습니다.
- 표시용 파생값은 selector나 렌더링 시 계산하고 별도 상태로 중복 저장하지 않습니다.
- mutation 성공 후 서버가 반환한 최신 리소스를 캐시에 반영하고 영향 범위가 불명확하면 관련 query를 무효화합니다.
- optimistic update는 실패 시 이전 snapshot으로 되돌릴 수 있는 기능에만 적용합니다.
- 재시도 횟수와 stale 시간은 전역 고정값이 아니라 업무 특성별로 정합니다.

## 주요 흐름 규칙

### 인증과 로그아웃

- 서버 세션이 인증의 단일 원본입니다.
- 클라이언트에는 화면 표시에 필요한 최소 사용자 정보만 전달합니다.
- 로그아웃이 서버에서 확정되면 사용자 범위 Query Cache를 제거하고 인증 화면으로 이동합니다.
- 토큰 갱신과 판매자 동의 여부를 전역 client store가 판정하지 않습니다.

### 결제 결과

- `/payment/result`는 URL이나 브라우저 상태를 성공 근거로 사용하지 않습니다.
- 주문 식별자로 서버 상태를 다시 조회해 새로고침과 외부 PG 복귀를 복구합니다.
- 결제 요청 중 UI 상태와 서버의 결제 상태를 하나의 boolean으로 합치지 않습니다.

### LIVE와 채팅

- 스트리밍, 채팅, AI 연결은 각각 adapter로 분리합니다.
- 서버 snapshot을 기준으로 두고 실시간 이벤트는 snapshot을 보정합니다.
- 이벤트에 순서나 버전 보장이 있으면 Query Cache를 갱신하고, 보장이 없거나 누락이 감지되면 query를 무효화해 재조회합니다.
- 연결 상태는 해당 LIVE 기능 경계에서 관리하고 다른 페이지의 전역 상태로 올리지 않습니다.
- optimistic 메시지는 임시 ID와 전송 상태를 가지며 서버 확정 ID를 받으면 교체합니다.

### 폼 draft

- 한 화면에서 끝나는 입력은 컴포넌트 또는 form boundary에 둡니다.
- 여러 라우트에 걸친 draft 저장은 요구사항이 확정된 뒤 서버 임시저장을 우선 검토합니다.
- 새로고침 복구가 필요하다는 이유만으로 전체 폼을 `localStorage`에 저장하지 않습니다.

## MSW 연결 원칙

MSW는 상태 저장소가 아니라 실제 API와 동일한 HTTP 경계를 제공하는 개발·테스트 도구입니다.

- UI와 query 함수는 목업 여부를 알지 못해야 합니다.
- handler의 URL, Request, Response와 오류 형식은 확정된 API 계약을 그대로 사용합니다.
- 성공뿐 아니라 빈 결과, 권한 오류, 검증 오류, 지연과 서버 오류 시나리오를 제공합니다.
- 목업 전용 enum이나 응답 필드를 애플리케이션 타입의 사실상 계약으로 만들지 않습니다.
- 실제 API 전환은 base URL과 실행 환경만 바꾸고 query와 컴포넌트는 유지합니다.
- production bundle에서는 MSW를 실행하지 않습니다.

첫 검증 대상은 판매자 프로젝트 목록입니다. 다음 조건이 갖춰지면 TanStack Query와 MSW를 함께 도입합니다.

1. 목록 Request·Response와 페이지네이션 기준이 확정됩니다.
2. 카드에 필요한 카테고리, 참여자 수, 모금액, 목표액과 진행 상태 필드가 확정됩니다.
3. 공통 오류 형식과 인증 전달 방식이 확정됩니다.
4. MSW 조회 결과로 loading, success, empty와 error 상태를 확인합니다.
5. 필터·페이지는 URL이 소유하고 Query Key는 해당 값을 입력으로 사용합니다.

## 재검토 조건

아래 중 하나가 실제 요구사항으로 확인될 때만 Zustand를 다시 평가합니다.

- 서로 떨어진 세 개 이상의 Client Component가 같은 임시 상태를 빈번하게 읽고 수정합니다.
- URL이나 서버에 저장할 수 없는 편집 세션이 여러 라우트에서 유지돼야 합니다.
- Context 분리만으로 해결하면 Provider 중첩과 불필요한 렌더링이 반복됩니다.
- LIVE 콘솔의 복잡한 로컬 상태 머신이 adapter와 컴포넌트 경계를 넘어 공유돼야 합니다.

Redux Toolkit은 이벤트 이력 추적, 복잡한 middleware 또는 조직 표준화 요구가 생길 때만 다시 평가합니다.

## 검증 기준

- 새 상태를 추가하는 PR은 상태 종류, 단일 원본, 소유 위치와 초기화 시점을 설명합니다.
- URL로 복원할 수 있는 상태를 전역 store에 중복 저장하지 않습니다.
- 서버 응답을 로컬 store에 복제하지 않습니다.
- loading, empty, error와 permission을 데이터 영역별로 구분합니다.
- MSW와 실제 API가 같은 query 함수와 타입을 사용합니다.
- 인증, 결제와 소유권은 서버 응답으로 최종 확인합니다.

## 참고 자료

- [React 상태 구조 원칙](https://react.dev/learn/choosing-the-state-structure).
- [Next.js Server와 Client Component](https://nextjs.org/docs/app/getting-started/server-and-client-components).
- [TanStack Query의 Server Component 가이드](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr).
- [TanStack Query Query Key 가이드](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys).
- [Zustand의 Next.js 가이드](https://zustand.docs.pmnd.rs/learn/guides/nextjs).
