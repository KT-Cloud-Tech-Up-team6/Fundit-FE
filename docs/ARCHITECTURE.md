# Fundit FE 아키텍처

## 목표

이 저장소는 라이브 커머스형 리워드 펀딩 서비스의 기능별 개발을 시작할 수 있는 프론트엔드 뼈대다. 현재 단계에서는 라우트·레이아웃·컴포넌트 책임과 문서 추적성을 제공하며 실제 API, 결제, 스트리밍, 채팅, AI 연동은 포함하지 않는다.

## 최상위 구조

```text
src/
├─ app/          # App Router 진입점, 레이아웃, 페이지, 오류 경계
├─ features/     # 모드 전환, 프로젝트 탭 등 사용자 행동 단위 UI
├─ entities/     # 프로젝트 등 도메인 표현 컴포넌트
├─ shared/       # 도메인에 의존하지 않는 공통 UI, 설정, 레이아웃
└─ providers/    # 전역 Provider 조합 지점
```

## 디렉터리 책임

- `app`은 URL 파라미터와 쿼리를 해석하고 레이아웃과 기능 컴포넌트를 조합한다. 복잡한 업무 규칙은 두지 않는다.
- `features`는 모드 전환, 찜, 결제 진행처럼 사용자 행동 단위의 상태와 UI를 소유한다.
- `entities`는 프로젝트, 리워드, LIVE, 펀딩, 배송, 환불처럼 여러 기능에서 재사용되는 도메인 표현을 소유한다.
- `shared`는 도메인 타입을 알 필요가 없는 레이아웃, 기본 UI, 상수와 유틸리티를 소유한다.
- `providers`는 인증, TanStack Query, 테마, LIVE·채팅 어댑터를 한곳에서 조합하기 위한 경계다. 현재는 첫 API 계약 전이라 외부 상태 라이브러리를 설치하지 않은 빈 조합 지점이다.

## 컴포넌트 배치 기준

1. 라우트 파라미터·메타데이터·페이지 조합은 `app`에 둔다.
2. 여러 화면에서 반복되는 도메인 비의존 UI는 `shared/components`에 둔다.
3. 사용자의 구체적 행동을 수행하는 UI와 상태는 `features/<feature>`에 둔다.
4. 도메인 모델과 재사용 표시 요소는 `entities/<entity>`에 둔다.
5. 한 페이지에서만 쓰이는 단순 마크업은 페이지에 유지한다.

의존 방향은 `app → features → entities → shared`를 기본으로 한다. `shared`는 `features`나 `entities`를 import하지 않는다. BuyerShell과 SellerShell은 서로를 import하지 않고 모드 전환 기능만 공유한다.

## Route Group

- `(buyer)`는 공개·구매자 화면을 묶고 BuyerShell을 적용한다.
- `(auth)`는 로그인과 3단계 회원가입에 AuthShell을 적용한다.
- `(seller)`는 `/seller` 하위 운영 화면에 SellerShell을 적용한다.

Route Group 이름은 URL에 노출되지 않는다. LIVE, 프로젝트, 펀딩 책임은 각 그룹 내부의 실제 URL 디렉터리로 분리한다. 동일 프로젝트 상세 탭은 `?tab=`, LIVE 재생 모드는 `?mode=`를 사용해 공통 데이터와 레이아웃 중복을 피한다.

## 공통 레이아웃

- `BuyerShell`은 mobile-first 하단 내비게이션과 데스크톱 상단 내비게이션을 제공한다.
- `AuthShell`은 인증 와이어프레임을 위한 전체 화면 반응형 영역을 제공한다.
- `SellerShell`은 PC-first 사이드바와 판매자 프로젝트 컨텍스트 영역을 제공한다.
- RootLayout은 메타데이터와 AppProviders만 소유하며 클라이언트 컴포넌트가 아니다.

## 기능 단위 개발 원칙

- Server Component를 기본으로 사용한다.
- 브라우저 이벤트와 로컬 상태가 필요한 가장 낮은 경계에만 `use client`를 둔다.
- loading, empty, error, permission 상태를 데이터 영역별로 분리한다.
- URL만으로 권한을 판단하지 않으며 판매자·리소스 소유권은 서버에서 재검증한다.
- 프로젝트·LIVE·펀딩·배송·환불 상태값은 BE 계약 전까지 코드 enum으로 확정하지 않는다.

## API와 상태관리 연결 위치

- HTTP client와 공통 오류 매핑은 계약 확정 후 `shared/lib`에 둔다.
- 클라이언트 서버 상태는 TanStack Query로 관리한다. 첫 API 계약과 MSW handler가 확정되는 기능에서 설치하고 `providers`에 연결하며, 각 feature가 query 정의를 소유한다.
- 서버 렌더링 전용 데이터는 Server Component와 Next.js `fetch`가 소유하고 같은 리소스를 Query Cache에 중복 저장하지 않는다.
- 입력 draft와 schema validation은 각 feature의 form boundary에 둔다.
- 인증 사용자와 현재 모드처럼 제한된 전역 상태만 `providers`에서 제공한다.
- 스트리밍·채팅·AI는 각각 adapter 인터페이스로 분리해 한 영역의 실패가 다른 영역을 중단하지 않게 한다.

세부 상태 분류와 도구 선택 근거는 [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md), 미확정 계약은 [OPEN_DECISIONS.md](./OPEN_DECISIONS.md)에 기록한다.
