# Fundit

라이브 커머스형 리워드 펀딩 서비스 Fundit의 프론트엔드 저장소입니다.

구매자는 프로젝트와 LIVE를 탐색하고 펀딩에 참여하며, 판매자는 프로젝트 작성·펀딩 관리·LIVE 운영·제작 및 배송을 관리합니다. 아래 구현 상태는 서비스의 목표 기능과 실제 연결 완료 범위를 구분합니다.

## 현재 구현 상태

2026년 9월 20일(KST, UTC+09:00) 기준입니다. 주요 화면과 목업 기반 인터랙션, 인증·회원가입, 판매자 프로젝트·리워드·스토리·펀딩 관리, 구매자 탐색·회원·주문·결제 준비·제작배송 API 연결을 구현했습니다. Docker 이미지 검증 및 ECR 업로드 CI를 갖추었으며, 실제 BE·외부 서비스·클라우드 환경의 통합 QA는 완료되지 않았습니다.

| 구분             | 상태                                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 구매자 화면      | LIVE 목록·상세·시청·다시보기, 카테고리·검색·찜·마이페이지, 결제·제작배송 등의 화면과 목업 흐름 구현. 일부 탭·보조 화면은 placeholder 유지                                             |
| 판매자 화면      | 프로젝트 작성·스토리 편집·AI 스토리 목업·펀딩관리·LIVE 콘솔·제작배송 등의 화면 구현. 실제 송출·AI·배송 연동 완료를 의미하지 않음                                                      |
| 인증 및 API 연결 | [#97](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/pull/97)의 인증·회원가입 기반과 #200~#207의 기능별 API 연결 통합. 생성 복구·카드 상세 ID·실결제 등 제한은 아래 QA 항목 참조 |
| 이미지 배포 준비 | PR에서 Docker 빌드·기동 검증, main push에서 검증 후 AWS ECR 업로드                                                                                                                    |
| 통합 QA          | 실제 Gateway 주소·테스트 계정과 데이터·배포 환경을 확정하고 진행해야 함. ECR 업로드 성공은 서비스 배포 및 API 연동 완료와 별개                                                        |

일반 로그인 화면은 현재 실제 제출이 비활성화돼 있습니다. 회원가입 화면이 존재한다는 사실만으로 PortOne 본인인증과 BE 가입이 실제 연결된 상태로 판단하지 않습니다. LIVE 시작·종료 조작은 보류 중이며, 실제 IVS 송출·채팅과 AI 연결도 별도 작업입니다.

## FE 개발자 소개

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/intothehead">
        <img
          src="https://github.com/intothehead.png?size=120"
          width="110"
          alt="이중호"
        />
        <br />
        <strong>이중호</strong>
      </a>
      <br />
      FE / 파트장
    </td>
    <td align="center">
      <a href="https://github.com/hanna-um">
        <img
          src="https://github.com/hanna-um.png?size=120"
          width="110"
          alt="엄한나"
        />
        <br />
        <strong>엄한나</strong>
      </a>
      <br />
      FE / 팀원
    </td>
  </tr>
</table>

## 기술 스택

| 역할            | main 적용 기술                          | 사용 범위                                   |
| --------------- | --------------------------------------- | ------------------------------------------- |
| 프레임워크      | Next.js 16.3.2, React 19.2.8            | App Router, Route Group, 화면·레이아웃 조합 |
| 언어            | TypeScript 5                            | strict 타입 검사                            |
| 스타일          | Tailwind CSS 4, CSS Modules             | 디자인 토큰과 화면별 스타일                 |
| 스토리 편집     | Tiptap 3                                | 리치텍스트 편집                             |
| 클라이언트 상태 | React 지역 상태·Context, URL            | 입력·기능별 공유 상태, 탭·필터·페이지 상태  |
| 테스트·UI 확인  | Node.js test runner + tsx, Storybook 10 | 모델·유틸리티 테스트와 컴포넌트 상태 확인   |
| 코드 품질       | ESLint 9, Prettier 3                    | 정적 검사와 포맷                            |
| 패키지 관리     | pnpm 10.33.2                            | lockfile 기반 설치                          |
| CI·이미지       | GitHub Actions, Docker, AWS ECR         | 검증·컨테이너 기동 확인·OIDC 인증 업로드    |

TanStack Query v5, React Hook Form·Zod, MSW, PortOne Browser SDK를 인증·회원가입 기반에 사용합니다. 후속 API 연결도 이 기반을 공유합니다.

### 상태 관리 원칙

- 공유 링크·새로고침·뒤로가기에 필요한 상태는 URL에서 관리합니다.
- 클라이언트 서버 상태는 TanStack Query로 관리합니다.
- 화면 내부 입력·모달·단계 전환은 `useState`·`useReducer`, 제한된 공유 상태는 Context를 사용합니다.
- Zustand·Redux Toolkit은 도입하지 않았습니다. 실제 공유 상태 문제가 확인되면 재검토합니다.

자세한 기준은 [상태 관리 전략](./docs/STATE_MANAGEMENT.md)을 확인하세요.

### 디자인 기준

- 모바일은 1199px 이하, 웹은 1200px 이상이며 별도 태블릿 디자인은 없습니다. 화면별 적용 범위는 해당 설계 문서를 따릅니다.
- 기본 폰트는 자체 호스팅하는 Pretendard Variable입니다. 숏 클립 강조 자막은 Figma 명세에 따라 Gmarket Sans를 사용합니다.
- 공용 색상·타이포그래피·간격과 반응형 기준은 [디자인 토큰](./docs/DESIGN_TOKENS.md), 구현 규칙은 [공용 컴포넌트](./docs/SHARED_COMPONENTS.md) 문서를 따릅니다.

## 프로젝트 구조

주요 디렉터리를 요약한 구조입니다.

```text
Fundit-FE/
├─ .github/                     # Issue·PR 템플릿과 CI
├─ .storybook/                  # 컴포넌트 개발 환경
├─ docs/                        # 구조·라우팅·디자인·API·배포 문서
├─ public/                      # 이미지·아이콘·자체 호스팅 폰트
├─ src/
│  ├─ app/
│  │  ├─ (auth)/               # 로그인·회원가입·계정 복구
│  │  ├─ (buyer)/              # 구매자 공통·보조 경로
│  │  ├─ (buyer-category)/     # 카테고리
│  │  ├─ (buyer-search)/       # 검색
│  │  ├─ (buyer-live)/         # LIVE 목록·시청·다시보기
│  │  ├─ (buyer-project)/      # 프로젝트 상세
│  │  ├─ (buyer-funding)/      # 펀딩 참여 내역
│  │  ├─ (buyer-fulfillment)/  # 제작·배송 조회
│  │  ├─ (buyer-mypage)/       # 마이페이지
│  │  ├─ (buyer-wishlist)/     # 찜
│  │  ├─ (buyer-refunds)/      # 환불
│  │  ├─ (checkout)/           # 주문·결제 결과
│  │  ├─ (seller)/             # 판매자 프로젝트·LIVE 관리
│  │  └─ (live-console)/       # 판매자 LIVE 콘솔
│  ├─ entities/                # 도메인 모델·표현
│  ├─ features/                # 사용자 기능별 모델·UI
│  ├─ providers/               # Provider 조합
│  └─ shared/                  # 공용 UI·설정·유틸리티
├─ Dockerfile
├─ .dockerignore
├─ .env.example
├─ CONTRIBUTING.md
├─ next.config.ts
├─ package.json
└─ pnpm-lock.yaml
```

## 주요 라우팅

아래 상태는 main의 화면 기준입니다. 목업 흐름은 실제 저장·결제·송출 성공을 보장하지 않습니다.

| 사용자 | 경로                                                             | 화면 및 현재 범위                                                                              |
| ------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 공통   | `/`                                                              | 별도 홈 피드 없이 `/live`로 이동                                                               |
| 공통   | `/auth/signup`, `/auth/signup/*`                                 | 약관·본인인증·회원가입 API 연결. 실제 BE·PortOne 통합 QA는 미완료                              |
| 공통   | `/auth/login`, `/auth/recovery/*`                                | 로그인·복구 화면. 실제 로그인 제출 비활성화                                                    |
| 구매자 | `/live`, `/live/upcoming`, `/live/[liveId]`                      | 목록·예정·시청·다시보기 화면과 목업                                                            |
| 구매자 | `/categories/[slug]`, `/search`, `/my/wishlist`                  | 카테고리·검색·찜 화면과 목업                                                                   |
| 구매자 | `/projects/[projectId]?tab=...`                                  | 스토리·LIVE 검증 상세와 리워드 선택. 나머지 탭에는 placeholder가 남아 있음                     |
| 구매자 | `/funding/[projectId]/checkout`, `/payment/result`               | 결제 입력·결과 목업. 기존 리워드 선택 경로는 프로젝트 상세로, payment 경로는 checkout으로 이동 |
| 구매자 | `/my`, `/my/fundings`, `/my/refunds`                             | 마이페이지·펀딩·환불 화면과 목업                                                               |
| 구매자 | `/my/fundings/[fundingId]/fulfillment`                           | 제작·배송 현황. 하위 `/history`에서 기록 확인                                                  |
| 판매자 | `/seller/projects`, `/seller/projects/new`                       | 프로젝트 목록·생성 화면과 목업                                                                 |
| 판매자 | `/seller/projects/[projectId]?tab=...`                           | 기본정보·리워드·스토리·펀딩관리·제작배송 등. 탭별 구현 범위 상이                               |
| 판매자 | `/seller/live`                                                   | LIVE 스튜디오의 상태 탭·빈 목록 화면                                                           |
| 판매자 | `/seller/projects/[projectId]/live/new`                          | LIVE 생성·기본 설정 저장. 이어서 AI 큐시트를 생성할 수 있음                                    |
| 판매자 | `/seller/live/[liveId]/setup`, 같은 ID의 `/cue-sheet`·`/console` | LIVE 설정·콘솔은 목업, 큐시트는 실제 API 연결(생성 중·성공·실패 구분)                          |
| 판매자 | `/seller/live/[liveId]/review`                                   | 방송 후 검증·하이라이트 검수 placeholder                                                       |

전체 URL과 접근 조건은 [라우팅 문서](./docs/ROUTING.md)를 확인하세요. 실제 인증·소유권 검증은 서버 연결 여부와 함께 확인해야 합니다.

## 로컬 실행

CI·Docker와 같은 **Node.js 24**, **pnpm 10.33.2** 사용을 권장합니다.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

`http://localhost:3000`에 접속하면 `/live`로 이동합니다.

### 환경변수

main의 목업 화면 실행에는 필수 환경변수가 없습니다. 필요한 경우 `.env.example`을 복사합니다.

```bash
cp .env.example .env.local
```

PowerShell에서는 `Copy-Item .env.example .env.local`을 사용합니다.

인증·회원가입 연결에는 다음 변수가 정의돼 있습니다. 실제 설정은 `.env.example`과 확정된 BE·인프라 환경을 따릅니다.

| 변수                              | 용도                                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`        | 브라우저에서 접근할 API 주소. 빈 값은 같은 origin의 `/api/...` 요청이며, Gateway 연결을 위한 라우팅이 필요 |
| `NEXT_PUBLIC_MSW_ENABLED`         | 개발 환경에서 목업 응답 활성화 여부. 실제 BE 연결 시 `false`                                               |
| `NEXT_PUBLIC_PORTONE_STORE_ID`    | PortOne 본인인증용 공개 상점 식별자                                                                        |
| `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` | PortOne 본인인증용 공개 채널 식별자                                                                        |

`NEXT_PUBLIC_*`는 브라우저에 노출되고 빌드 시 고정됩니다. 비밀키를 넣지 않습니다. PortOne 두 설정은 GitHub Repository Variables에서 Docker 빌드 인자로 전달합니다. 등록·재빌드 방법은 [컨테이너 배포 문서](./docs/CONTAINER_DEPLOYMENT.md#portone-본인인증-빌드-설정)를 따릅니다. API 주소 등 다른 공개 설정의 이미지 주입은 별도 범위입니다. `.env*`는 Docker 빌드 컨텍스트에서 제외됩니다.

## 사용 가능한 명령어

| 명령어                 | 설명                                                         |
| ---------------------- | ------------------------------------------------------------ |
| `pnpm dev`             | 개발 서버 실행                                               |
| `pnpm build`           | 프로덕션 빌드 및 standalone 산출물 생성                      |
| `pnpm start`           | `next start` 실행. 컨테이너는 아래 standalone 실행 방식 사용 |
| `pnpm test`            | tsx를 통한 Node.js 테스트 실행                               |
| `pnpm lint`            | ESLint 검사                                                  |
| `pnpm typecheck`       | Next.js 라우트 타입 생성 및 TypeScript 검사                  |
| `pnpm format`          | Prettier로 파일 정리                                         |
| `pnpm format:check`    | 포맷 검사                                                    |
| `pnpm storybook`       | Storybook 개발 서버 실행, 기본 포트 6006                     |
| `pnpm build-storybook` | Storybook 정적 빌드                                          |

## Docker·CI·배포

Next.js의 `output: "standalone"`을 사용합니다. Docker 이미지는 실행 산출물·정적 파일을 포함하고 비루트 사용자로 `node server.js`를 실행합니다. 기본 컨테이너 포트는 3000입니다.

```bash
docker build --platform linux/amd64 --tag fundit-frontend:local .
docker run --rm --publish 127.0.0.1:3000:3000 fundit-frontend:local
```

| 이벤트       | 실행 흐름                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------- |
| PR 생성·갱신 | `validate`의 포맷·린트·타입·빌드·테스트 → `verify-image`의 Docker 빌드·컨테이너 기동 확인 |
| main push    | `validate` → `publish-image`의 Docker 빌드·기동 확인·OIDC 인증·ECR 업로드                 |

PR의 `publish-image`, main push의 `verify-image`가 생략되는 것은 정상입니다. 이미지 태그는 `sha-<전체 Git 커밋 SHA>`, 플랫폼은 `linux/amd64`, ECR 저장소는 `fundit-frontend`입니다. 업로드된 이미지 주소는 Actions Job Summary에서 확인합니다.

GitOps·ArgoCD를 통한 실제 서비스 배포는 별도 인프라 단계입니다. 자세한 이미지 구성·인증·인계 절차는 [컨테이너 배포 문서](./docs/CONTAINER_DEPLOYMENT.md)를 확인하세요.

## API 연동 및 QA

- [#97](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/pull/97)은 인증·회원가입 기반입니다.
- 판매자 API는 [#200 프로젝트](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/pull/200), [#201 리워드](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/pull/201), [#202 스토리](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/pull/202), [#203 펀딩관리](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/pull/203)에서 다룹니다.
- 구매자 API는 [#204 탐색·상세](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/pull/204), [#205 회원·찜·배송지](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/pull/205), [#206 주문·결제 준비](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/pull/206), [#207 제작배송](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/pull/207)에서 다룹니다.
- API PR의 로컬 테스트·HTTP 테스트 대역 검증과 실제 BE 서버 검증을 구분합니다. 브라우저에서 목업 흐름이 동작해도 실제 결제·본인인증·업로드 성공을 뜻하지 않습니다.
- 확정된 Gateway 주소·계정·연관 데이터·배포 이미지로 실제 핵심 흐름을 검증해야 합니다.
- BE가 화면용 목업을 제공할 경우 응답 형식뿐 아니라 저장 후 재조회·상태 변경 지원 여부도 확인합니다. Storybook과 자동 테스트용 목업은 별도로 유지합니다.
- 실제 결제 승인, IVS·AI, 외부 배송 연동과 API 응답 누락 등은 해당 PR의 미완료·미검증 항목 및 [API 계약 문서](./docs/API_CONTRACT.md)를 확인합니다. API 클라이언트 구현이 실서비스 통합 완료를 뜻하지 않습니다.
- 리워드([#214](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/214))·주문([#215](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/215)) 생성은 `Idempotency-Key`로 같은 시도의 서버 결과를 되찾습니다. 프로젝트 생성 멱등성과 불확실한 결과 복구는 [#213](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/213)에서 추적하며, 현재 프로젝트의 탭 단위 FE 방어는 다중 탭·기기 중복 방지나 서버 결과 복구를 보장하지 않습니다.
- 구매자 목록·찜 카드의 숫자 ID와 공개 상세 UUID 연결은 [#216](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/issues/216)에서 추적합니다. 매핑 계약이 없는 카드의 상세 이동은 비활성 상태입니다.

## 설계 문서

- [기여 가이드](./CONTRIBUTING.md).
- [아키텍처](./docs/ARCHITECTURE.md).
- [라우팅](./docs/ROUTING.md).
- [디자인 토큰](./docs/DESIGN_TOKENS.md).
- [공용 컴포넌트](./docs/SHARED_COMPONENTS.md).
- [상태 관리](./docs/STATE_MANAGEMENT.md).
- [API 계약](./docs/API_CONTRACT.md).
- [소비자 흐름 연결](./docs/BUYER_FLOW_CONTINUITY.md).
- [미확정 사항](./docs/OPEN_DECISIONS.md).
- [컨테이너 배포](./docs/CONTAINER_DEPLOYMENT.md).

## 개발 참여

모든 구현과 수정은 `1 Issue → 1 Branch → 1 Pull Request` 단위로 진행합니다. 브랜치·커밋·코드 작성 규칙과 제출 전 검증은 [기여 가이드](./CONTRIBUTING.md)를 확인하세요.

## GitHub Organization

[KT-Cloud-Tech-Up-team6](https://github.com/KT-Cloud-Tech-Up-team6)
