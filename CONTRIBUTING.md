# Fundit FE 기여 가이드

이 문서는 Fundit FE 저장소의 Issue, 브랜치, 커밋, Pull Request와 코드 작성 규칙을 정의한다.

## 기본 원칙

- 모든 구현과 수정은 GitHub Issue에서 시작한다.
- 하나의 Issue는 하나의 Branch와 하나의 Pull Request로 완료한다.
- 요구사항이나 정책이 확정되지 않은 작업은 Issue에 결정 필요 사항을 남기고 임의로 구현하지 않는다.
- `main`에는 직접 Push하지 않고 Pull Request를 통해 병합한다.
- 작업 범위와 관계없는 리팩터링이나 포맷 변경을 함께 포함하지 않는다.

## Issue 단위 개발 흐름

1. Issue에 목적, 작업 범위, 완료 조건과 관련 요구사항을 작성한다.
2. 담당자와 선행 결정 또는 의존 작업을 확인한다.
3. 최신 `main`에서 Issue 번호를 포함한 브랜치를 생성한다.
4. Issue 범위만 구현하고 관련 검증을 실행한다.
5. Pull Request에 `Closes #이슈번호`를 작성한다.
6. CI 통과와 리뷰 승인을 확인한 뒤 병합한다.

Issue 하나에 서로 독립적인 기능이 포함되면 구현 전에 Issue를 나눈다. 함께 변경해야만 동작하는 작은 수정은 하나의 Issue로 유지할 수 있다.

## Issue 작성 기준

Issue에는 다음 내용을 포함한다.

- 작업의 배경과 목적.
- 구현 범위와 제외 범위.
- 확인 가능한 완료 조건.
- 관련 요구사항 코드, 화면 ID 또는 설계 문서.
- BE, AI, 기획, 디자인, 인프라 또는 보안 협의가 필요한 내용.
- 선행 Issue나 외부 의존성.

작업 유형에 맞는 Issue 템플릿을 사용한다.

| 템플릿                                         | 용도                 | 라벨    |
| ---------------------------------------------- | -------------------- | ------- |
| [Feature](./.github/ISSUE_TEMPLATE/feature.md) | 새로운 기능이나 화면 | `feat`  |
| [Bug](./.github/ISSUE_TEMPLATE/bug.md)         | 버그 제보와 수정     | `bug`   |
| [Task](./.github/ISSUE_TEMPLATE/task.md)       | 리팩터링, 문서, 설정 | `chore` |

## 브랜치 규칙

브랜치 이름은 `type/issue-number-short-description` 형식을 사용한다.

```text
feat/12-project-search
fix/27-mobile-navigation
refactor/31-project-tabs
docs/35-api-contract
chore/40-ci-workflow
```

허용하는 유형은 다음과 같다.

| 유형       | 용도                         |
| ---------- | ---------------------------- |
| `feat`     | 새로운 기능                  |
| `fix`      | 버그 수정                    |
| `refactor` | 동작 변경 없는 구조 개선     |
| `docs`     | 문서 변경                    |
| `chore`    | 설정, 의존성, 개발 환경 작업 |

## 커밋 규칙

커밋 메시지는 Conventional Commits 형식을 사용한다.

```text
<type>(optional-scope): <description>
```

```text
feat(search): add project result layout
fix(navigation): correct mobile safe area
refactor(project): separate tab configuration
docs: update API decisions
chore: configure CI workflow
```

사용 가능한 주요 유형은 `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`, `build`다. 설명은 변경 결과가 드러나도록 짧고 구체적으로 작성하며, 하나의 커밋에는 하나의 논리적 변경만 포함한다.

## Pull Request 규칙

- 제목은 커밋 메시지와 같은 Conventional Commits 형식을 사용한다.
- 본문에 `Closes #이슈번호`를 작성해 병합 시 Issue가 자동 종료되도록 한다.
- 주요 변경 내용과 검증 결과를 작성한다.
- UI 변경에는 데스크톱과 모바일 화면 또는 확인 방법을 첨부한다.
- API, 상태값, 정책을 임의로 확정하지 않았는지 확인한다.
- CI의 lint, typecheck, build가 통과하고 최소 한 명의 리뷰 승인을 받은 뒤 병합한다.

## 코드 컨벤션

### 이름과 파일

- 파일과 디렉터리는 `kebab-case`를 사용한다.
- React 컴포넌트와 타입은 `PascalCase`를 사용한다.
- 함수와 변수는 `camelCase`를 사용한다.
- Next.js의 page와 layout은 `default export`를 사용한다.
- 재사용 컴포넌트와 유틸리티는 `named export`를 사용한다.
- 저장소 내부 import는 `@/` alias를 우선 사용한다.

### 컴포넌트와 의존성

- Server Component를 기본으로 사용한다.
- 브라우저 API, 이벤트 또는 로컬 상태가 필요한 가장 낮은 경계에만 `use client`를 선언한다.
- `app`은 라우트 해석과 페이지 조합을 담당한다.
- `features`는 사용자 행동 단위 기능을 담당한다.
- `entities`는 재사용되는 도메인 표현을 담당한다.
- `shared`는 도메인에 의존하지 않는 공통 UI와 유틸리티를 담당한다.
- 기본 의존 방향은 `app → features → entities → shared`로 유지한다.
- 페이지에 복잡한 업무 규칙이나 API 세부 구현을 몰아넣지 않는다.

### 형식과 품질

- Prettier 결과를 코드 형식의 기준으로 사용한다.
- ESLint 경고를 임의로 비활성화하지 않는다.
- 비즈니스 상태값과 API 응답을 문서 없이 추측하지 않는다.
- 접근 가능한 시맨틱 HTML과 반응형 레이아웃을 기본으로 고려한다.
- 작업으로 인해 사용되지 않게 된 import와 코드만 함께 제거한다.

## 제출 전 검증

변경 범위에 맞는 검증을 먼저 실행하고, Pull Request 전에는 다음 명령을 확인한다.

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm format:check
```

검증하지 못한 항목이 있으면 Pull Request에 명령, 오류와 사유를 정확히 기록한다.
