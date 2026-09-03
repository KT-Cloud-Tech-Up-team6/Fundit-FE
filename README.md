# Fundit

라이브 커머스형 리워드 펀딩 서비스 Fundit의 프론트엔드 저장소입니다.

> 현재 저장소는 IA v1.2와 최신 FE 화면·컴포넌트·라우팅 설계서를 기준으로 만든 초기 구조입니다. 실제 API, 결제, 스트리밍, 채팅, AI 연동은 포함하지 않습니다.

## 프로젝트 소개

Fundit은 구매자가 프로젝트와 LIVE를 탐색하고 리워드 펀딩에 참여하며, 판매자가 프로젝트 작성부터 LIVE 운영, 펀딩·커뮤니티·제작·배송까지 관리하는 서비스입니다.

### 주요 사용자와 핵심 기능

- 구매자는 홈·카테고리·검색에서 프로젝트를 탐색하고 LIVE를 시청합니다.
- 구매자는 리워드 선택·주문·결제를 거쳐 펀딩에 참여하고 제작·배송·환불 상태를 확인합니다.
- 판매자는 프로젝트를 직접 작성하거나 AI 스토리 생성을 보조 수단으로 사용합니다.
- 판매자는 LIVE 설정·송출·채팅·Copilot과 방송 후 검증 콘텐츠를 관리합니다.
- 판매자는 펀딩 현황, 커뮤니티 문의, 제작 일정과 발송 정보를 관리합니다.

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

| 역할            | 기술                                                                                                                                         | 선정 이유                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Runtime/Routing | <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />             | App Router의 Route Group, Server Component, loading·error 경계로 구매자·인증·판매자 흐름을 분리합니다. |
| UI              | <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=111827" alt="React 19" />                    | Shell과 기능 UI를 컴포넌트 단위로 조합합니다.                                                          |
| Language        | <img src="https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5" />        | strict mode로 라우트와 기능 경계의 타입 안전성을 확보합니다.                                           |
| Styling         | <img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />   | 구매자 mobile-first와 판매자 PC-first 반응형 구조를 빠르게 공유합니다.                                 |
| Validation      | 미도입                                                                                                                                       | 폼 필드와 BE 계약이 확정된 뒤 실제 요구사항에 맞는 schema 도구를 선정합니다.                           |
| State           | 미도입                                                                                                                                       | 서버 상태·draft·전역 UI의 소유권을 먼저 확정하고 필요한 도구만 도입합니다.                             |
| Formatting      | <img src="https://img.shields.io/badge/Prettier_3-F7B93E?style=for-the-badge&logo=prettier&logoColor=111827" alt="Prettier 3" />             | 팀 공통 코드 형식을 자동화합니다.                                                                      |
| Package Manager | <img src="https://img.shields.io/badge/pnpm_10-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm 10" />                        | 고정된 lockfile과 효율적인 의존성 설치를 제공합니다.                                                   |
| CI              | <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" /> | PR과 main 변경에서 lint·typecheck·build를 검증합니다.                                                  |
| Hosting         | 미정                                                                                                                                         | 배포 플랫폼과 환경별 설정 정책을 인프라 협의 후 결정합니다.                                            |

## 프로젝트 구조

```text
Fundit-FE/
├─ .github/
│  ├─ ISSUE_TEMPLATE/
│  │  └─ task.md                   # Issue 단위 작업 정의
│  ├─ workflows/
│  │  └─ ci.yml                     # install → format → lint → typecheck → build
│  └─ pull_request_template.md
├─ docs/
│  ├─ ARCHITECTURE.md               # 디렉터리·의존성·상태 소유 원칙
│  ├─ OPEN_DECISIONS.md             # 미확정 정책과 연동 계약
│  ├─ ROUTING.md                    # 전체 URL·가드·요구사항 추적표
│  └─ SHARED_COMPONENTS.md          # 공용 UI 승격·API·접근성 기준
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/                    # 로그인·3단계 회원가입
│  │  ├─ (buyer)/                   # 홈·탐색·LIVE·프로젝트·펀딩·마이
│  │  │  ├─ funding/[projectId]/
│  │  │  ├─ live/[liveId]/
│  │  │  ├─ my/fundings/[fundingId]/
│  │  │  └─ projects/[projectId]/
│  │  ├─ (seller)/seller/           # 프로젝트·LIVE·운영 콘솔
│  │  │  ├─ live/[liveId]/
│  │  │  └─ projects/[projectId]/
│  │  ├─ error.tsx
│  │  ├─ loading.tsx
│  │  └─ not-found.tsx
│  ├─ entities/project/             # 프로젝트 도메인 표현
│  ├─ features/
│  │  ├─ mode-switch/               # 구매자·판매자 모드 전환 진입
│  │  └─ project-tabs/               # 프로젝트 상세 쿼리 탭
│  ├─ providers/                    # 전역 Provider 조합 지점
│  └─ shared/
│     ├─ components/                # Shell과 공통 placeholder UI
│     └─ config/                    # 공통 내비게이션 설정
├─ .env.example
├─ CONTRIBUTING.md                 # Git·Issue·코드 컨벤션
├─ package.json
├─ pnpm-lock.yaml
└─ tsconfig.json
```

## 주요 라우팅

| 사용자 | 경로                                   | 화면                       | 상태        |
| ------ | -------------------------------------- | -------------------------- | ----------- |
| 공통   | `/auth/signup`, `/auth/signup/*`       | 회원가입·포트원 본인인증   | implemented |
| 공통   | `/auth/login`, `/auth/recovery/*`      | 로그인·계정 복구           | implemented |
| 구매자 | `/`                                    | 홈 피드                    | placeholder |
| 구매자 | `/live`, `/live/[liveId]`              | LIVE 목록·시청·다시보기    | placeholder |
| 구매자 | `/projects/[projectId]?tab=...`        | 프로젝트 상세 8개 탭       | placeholder |
| 구매자 | `/funding/[projectId]/rewards`         | 리워드 선택·주문·결제 흐름 | placeholder |
| 구매자 | `/my`, `/my/fundings`                  | 마이·펀딩·제작·배송 관리   | placeholder |
| 판매자 | `/seller/projects`                     | 프로젝트 관리              | implemented |
| 판매자 | `/seller/projects/[projectId]?tab=...` | 프로젝트 작성·운영 탭      | placeholder |
| 판매자 | `/seller/live`                         | LIVE 스튜디오 홈           | placeholder |
| 판매자 | `/seller/live/[liveId]/cue-sheet`      | AI 큐시트                  | placeholder |
| 판매자 | `/seller/live/[liveId]/console`        | LIVE 송출·채팅·Copilot     | placeholder |
| 판매자 | `/seller/live/[liveId]/review`         | 검증·하이라이트 검수       | placeholder |

전체 라우트와 접근 조건은 [라우팅 문서](./docs/ROUTING.md)를 확인하세요.

## 로컬 실행

### 요구 환경

- Node.js 20 이상.
- pnpm 10.33.2.

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## 환경변수

현재 초기 구조 실행에는 환경변수가 필요하지 않습니다. 향후 API, LIVE, 결제 계약이 확정되면 `.env.example`에 변수 이름만 추가하고 실제 비밀값은 로컬 환경 또는 배포 플랫폼의 Secret으로 관리합니다.

```bash
cp .env.example .env.local
```

PowerShell에서는 다음 명령을 사용할 수 있습니다.

```powershell
Copy-Item .env.example .env.local
```

## 사용 가능한 명령어

| 명령어              | 설명                   |
| ------------------- | ---------------------- |
| `pnpm dev`          | 개발 서버 실행         |
| `pnpm build`        | production build 생성  |
| `pnpm start`        | build 결과 실행        |
| `pnpm lint`         | ESLint 검사            |
| `pnpm typecheck`    | TypeScript strict 검사 |
| `pnpm format`       | Prettier로 파일 정리   |
| `pnpm format:check` | 포맷 변경 없이 검사    |

## 설계 문서

- [CONTRIBUTING.md](./CONTRIBUTING.md).
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md).
- [ROUTING.md](./docs/ROUTING.md).
- [SHARED_COMPONENTS.md](./docs/SHARED_COMPONENTS.md).
- [OPEN_DECISIONS.md](./docs/OPEN_DECISIONS.md).

## 개발 참여

모든 구현과 수정은 `1 Issue → 1 Branch → 1 Pull Request` 단위로 진행합니다. 브랜치·커밋·코드 작성 규칙과 제출 전 검증은 [기여 가이드](./CONTRIBUTING.md)를 확인하세요.

## 현재 구현 범위

- Next.js App Router와 TypeScript strict, Tailwind CSS, ESLint, Prettier, pnpm 구성.
- BuyerShell, AuthShell, SellerShell과 반응형 기본 내비게이션.
- IA v1.2 화면 ID에 대응하는 canonical route placeholder와 이전 경로 호환 redirect.
- 프로젝트 상세 `tab`, LIVE `mode`, 판매자 프로젝트 `tab`, LIVE 검토 `tab`, 환불 `type` 쿼리 구조.
- 공통 loading, error, not-found 경계.
- GitHub Actions CI와 PR 템플릿.

## 추후 결정할 사항

인증·판매자 등록, API 계약, 프로젝트 공개, 결제·환불, LIVE·채팅·AI, 배송조회, 알림과 호스팅은 아직 확정하지 않았습니다. 상세 목록과 협의 대상은 [OPEN_DECISIONS.md](./docs/OPEN_DECISIONS.md)에 기록되어 있습니다.

## GitHub Organization

[KT-Cloud-Tech-Up-team6](https://github.com/KT-Cloud-Tech-Up-team6)
