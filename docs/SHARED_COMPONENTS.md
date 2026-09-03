# 공용 컴포넌트 설계 기준

이 문서는 Fundit FE의 공용 컴포넌트 승격 기준, 책임 범위와 변경 규칙을 정의합니다. 컴포넌트를 미리 늘리는 것이 목적이 아니라 화면 구현 과정에서 중복과 도메인 결합을 막는 것이 목적입니다.

## 적용 범위

- `src/shared/components/ui`의 도메인 비의존 UI를 대상으로 합니다.
- `src/shared/components/layout`의 Shell은 여러 라우트가 공유하는 구조이지만 UI primitive와 별도로 관리합니다.
- 프로젝트, 리워드와 LIVE처럼 도메인 의미를 가진 표현은 `entities`가 소유합니다.
- 로그인, 찜과 결제처럼 사용자 행동과 업무 흐름을 가진 컴포넌트는 `features`가 소유합니다.
- 디자인 토큰의 원본과 매핑 규칙은 [DESIGN_TOKENS.md](./DESIGN_TOKENS.md)가 소유합니다.

## 공용화 판정 순서

새 컴포넌트를 만들거나 기존 컴포넌트를 공용으로 옮길 때는 아래 순서로 판단합니다.

1. 한 페이지에서만 쓰이는 단순 마크업이면 해당 페이지에 유지합니다.
2. 한 기능의 사용자 행동이나 상태 전이를 포함하면 `features/<feature>`에 둡니다.
3. 도메인 타입과 용어를 표현하고 여러 기능에서 재사용하면 `entities/<entity>`에 둡니다.
4. 도메인 지식 없이 두 곳 이상에서 같은 의미와 동작으로 반복되면 `shared/components/ui`로 승격합니다.
5. Figma 디자인 시스템에 정의된 primitive는 두 번째 사용처가 생기기 전이라도 가까운 화면 개발이 확정된 경우 공용으로 구현할 수 있습니다.

마크업이 비슷하다는 이유만으로 공용화하지 않습니다. 이름, 상태, 접근성 의미와 변경 주기가 같을 때만 같은 컴포넌트로 취급합니다.

## 디렉터리와 의존성

```text
src/shared/components/
├─ ui/       # Button, Input, Tab처럼 도메인 비의존 UI
└─ layout/   # BuyerShell, SellerShell처럼 라우트 공통 구조
```

- 파일은 `kebab-case`, 컴포넌트와 공개 타입은 `PascalCase`를 사용합니다.
- 공용 컴포넌트는 named export하고 `@/shared/components/ui/<file>`에서 직접 import합니다.
- `shared`는 `features`, `entities`와 `app`을 import하지 않습니다.
- 공용 컴포넌트는 API 호출, Query Key, 권한 판정과 업무 상태 전이를 소유하지 않습니다.
- 상태와 이벤트의 업무 의미는 호출자가 해석하고 공용 컴포넌트에는 표시 값과 일반 이벤트만 전달합니다.

## 컴포넌트 API 원칙

### 네이티브 요소를 확장합니다

- 가능한 경우 `ComponentPropsWithRef` 또는 `ComponentPropsWithoutRef`로 기반 HTML 요소의 표준 props와 ARIA 속성을 유지합니다.
- 클릭 동작은 `button`, 경로 이동은 `a` 또는 Next.js `Link`를 사용합니다. 시각 형태가 같아도 의미가 다르면 별도 렌더링 경로를 둡니다.
- `button`의 기본 `type`은 폼 제출을 의도하지 않는 한 `button`으로 둡니다.
- 호출자가 추가한 `className`은 기본 스타일과 병합하되 필수 시맨틱, focus와 disabled 상태를 깨는 용도로 사용하지 않습니다.

### 상태와 변형을 제한합니다

- `variant`와 `size`는 디자인 시스템에 확인된 값만 공개합니다.
- 상호 배타적인 상태가 여러 boolean 조합을 만들면 문자열 union 또는 구분된 union으로 표현합니다.
- controlled와 uncontrolled 사용을 모두 지원해야 할 때는 `value`와 `defaultValue`에 해당하는 공개 계약을 분리하고 두 모드의 결과를 같게 유지합니다.
- 로딩, 오류와 선택 상태를 컴포넌트가 추측하지 않습니다. 호출자가 명시적인 prop으로 전달합니다.
- 한 사용처를 위한 도메인 prop을 추가하지 않고 `children`, adornment 또는 합성 가능한 하위 컴포넌트를 우선 검토합니다.

### 상태 소유권을 작게 유지합니다

- Server Component를 기본으로 유지하고 브라우저 API, effect 또는 내부 상호작용 상태가 필요할 때만 `use client`를 선언합니다.
- 열림, 선택과 입력값을 상위 흐름이 소유해야 하면 제어 가능한 API를 제공합니다.
- 공용 컴포넌트 내부 상태는 키보드 탐색과 같이 컴포넌트 자체 동작을 완성하는 범위로 제한합니다.
- 서버 응답과 업무 draft를 공용 컴포넌트 내부에 복사하지 않습니다.

## 스타일과 디자인 토큰

- 화면과 컴포넌트는 primitive 색상값 대신 `globals.css`의 semantic 토큰 유틸리티를 사용합니다.
- 일반 CTA는 Charcoal 계열, LIVE 전용 variant만 `_live` semantic 토큰을 사용합니다.
- Figma에 없는 색상, 타이포와 radius를 임의 토큰으로 확정하지 않습니다.
- 간격은 Figma의 4px 체계와 일치하는 Tailwind 숫자 유틸리티를 사용합니다.
- 컴포넌트 한 곳에서만 필요한 확정 치수는 해당 파일에 유지합니다. 반복되거나 semantic 역할이 생길 때만 토큰 승격을 검토합니다.
- 반응형 크기와 배치는 컴포넌트의 본질적인 동작일 때만 포함하고 화면 구성에 따른 폭과 여백은 호출자가 소유합니다.

## 접근성 기준

- 시맨틱 HTML을 우선하고 ARIA로 네이티브 의미를 중복하거나 바꾸지 않습니다.
- 아이콘만 있는 버튼, dialog와 landmark에는 접근 가능한 이름을 제공합니다.
- 키보드만으로 모든 동작에 접근할 수 있어야 하며 focus 표시를 제거하지 않습니다.
- disabled 요소는 입력과 클릭을 막고, 링크형 disabled 표현은 `aria-disabled`와 focus 제외를 함께 처리합니다.
- 입력 오류는 색상만으로 전달하지 않고 `aria-invalid`와 연결된 오류 설명을 제공합니다.
- tab widget은 방향키, Home과 End 탐색 및 roving tabindex를 제공하고, URL 내비게이션 탭은 `aria-current`를 사용합니다.
- dialog는 focus, ESC, backdrop 닫기와 배경 상호작용 차단을 함께 검증합니다.
- 상태색은 [DESIGN_TOKENS.md](./DESIGN_TOKENS.md)의 대비 기준을 따르며 색상만으로 상태를 구분하지 않습니다.

## Storybook 계약

`shared/components/ui`의 공개 컴포넌트는 같은 디렉터리에 `*.stories.tsx`를 둡니다.

- title은 `Shared/UI/<Component>` 형식을 사용하고 `autodocs`를 활성화합니다.
- 기본 상태와 공개된 variant·size를 Controls에서 확인할 수 있게 합니다.
- 적용 가능한 disabled, error, selected, loading, empty와 긴 콘텐츠 상태를 포함합니다.
- 키보드와 focus 동작이 있는 컴포넌트는 상호작용 가능한 스토리를 제공합니다.
- 레이아웃이 달라지는 컴포넌트는 모바일과 데스크톱 조건을 확인합니다.
- light와 dark 테마에서 semantic 토큰 적용을 확인합니다.
- `@storybook/addon-a11y` 결과를 확인합니다. 현재 설정은 위반을 표시하는 `todo` 단계이므로 보고된 문제를 PR 검토에서 별도로 확인합니다.

## 현재 공용 UI 인벤토리

| 범주       | 컴포넌트                                     | 책임                                              |
| ---------- | -------------------------------------------- | ------------------------------------------------- |
| Action     | `Button`                                     | 기본·LIVE CTA의 크기, 상태와 네이티브 button 계약 |
| Form       | `Input`, `SearchField`, `Select`, `Checkbox` | 입력 시맨틱, 오류·disabled 상태와 focus 표현      |
| Navigation | `Tab`, `TabList`, `Pagination`               | 탭 위젯, URL 내비게이션과 페이지 이동             |
| Feedback   | `Badge`, `Chip`, `ProgressBar`               | 상태·선택·진행률의 도메인 비의존 표현             |
| Surface    | `Card`, `BottomSheet`                        | 콘텐츠 표면과 modal dialog 동작                   |
| Media      | `Icon`                                       | 허용된 아이콘 이름과 색상 상속                    |

이 표는 컴포넌트 사용법의 정본이 아닙니다. 공개 props와 상태 예시는 각 Storybook 스토리를 기준으로 확인합니다.

## 변경 절차

1. 기존 Storybook과 `shared/components/ui`에서 같은 의미의 컴포넌트가 있는지 확인합니다.
2. 기존 컴포넌트와 의미가 같으면 새 파일보다 최소 variant 또는 합성 방식으로 확장합니다.
3. 의미나 접근성 역할이 다르면 시각적 유사성만으로 합치지 않습니다.
4. 공개 props 변경과 함께 스토리를 갱신하고 기존 사용처의 호환성을 확인합니다.
5. 공용화로 이동하면서 원래 기능의 도메인 import와 업무 분기를 남기지 않습니다.
6. 더 이상 사용되지 않는 API는 같은 변경에서 제거할 수 있을 때만 제거하고 사용처가 남아 있으면 별도 변경으로 다룹니다.

## 검증 기준

공용 컴포넌트를 추가하거나 변경한 PR은 아래 항목을 확인합니다.

- 배치 이유와 실제 사용처가 설명되어 있습니다.
- 도메인 타입, API 호출과 Query 정의가 포함되지 않습니다.
- native props, ref와 ARIA 속성이 필요한 수준으로 전달됩니다.
- 기본, 변형, 오류와 비활성 상태의 Storybook 스토리가 갱신되었습니다.
- 키보드, focus와 접근 가능한 이름을 확인했습니다.
- semantic 디자인 토큰을 사용하고 light·dark 테마를 확인했습니다.
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`를 통과합니다.
- UI나 Storybook 구성이 바뀌면 `pnpm build-storybook`을 추가로 확인합니다.
