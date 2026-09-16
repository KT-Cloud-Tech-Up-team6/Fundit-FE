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

이 절은 공용 컴포넌트뿐 아니라 모든 화면과 컴포넌트에 적용합니다.

- 신규 컴포넌트와 화면은 Tailwind CSS를 기본으로 작성합니다.
- 기존 공용 컴포넌트와 디자인 토큰을 우선 사용합니다. 여러 화면에서 반복되는 UI는 위 공용화 판정 순서에 따라 분리합니다.
- 색상·글꼴·간격은 프로젝트에 정의된 토큰과 유틸리티를 사용합니다. primitive 색상값 대신 `globals.css`의 semantic 토큰을 사용하며, CSS Modules에서도 같은 CSS 변수를 참조합니다. 디자인상 필요한 예외 값은 사용 이유를 PR에 기록합니다.
- 복잡한 선택자·애니메이션·외부 라이브러리 스타일 등 별도 CSS가 더 명확한 경우 CSS Modules를 사용할 수 있습니다. 사용 이유를 PR에 기록합니다.
- 동일 요소의 동일 속성을 Tailwind와 CSS Modules에서 중복 지정하거나 덮어쓰지 않습니다.
- 기존 CSS Modules는 일괄 변환하지 않습니다. 해당 화면 수정 시 필요한 범위에서 정리합니다.
- 전역 CSS는 디자인 토큰·초기화·앱 전체에 적용되는 스타일에 한정합니다.
- 일반 CTA는 Charcoal 계열, LIVE 전용 variant만 `_live` semantic 토큰을 사용합니다.
- Figma에 없는 색상, 타이포와 radius를 임의 토큰으로 확정하지 않습니다.
- 간격은 Figma의 4px 체계와 일치하는 Tailwind 숫자 유틸리티를 사용합니다.
- 컴포넌트 한 곳에서만 필요한 확정 치수는 해당 파일에 유지합니다. 반복되거나 semantic 역할이 생길 때만 토큰 승격을 검토합니다.
- 반응형 크기와 배치는 컴포넌트의 본질적인 동작일 때만 포함하고 화면 구성에 따른 폭과 여백은 호출자가 소유합니다.
- 스타일 변경 시 관련 화면의 반응형·상태별 표시를 확인하고, 프로덕션 빌드에서도 스타일 적용을 검증합니다.

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

| 범주       | 컴포넌트                                              | 책임                                                                 |
| ---------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| Action     | `Button`, `TextButton`                                | 기본·LIVE CTA와 보조 텍스트 액션의 크기, 상태와 네이티브 button 계약 |
| Form       | `Input`, `SearchField`, `Select`, `Checkbox`, `Radio` | 입력 시맨틱, 오류·disabled 상태와 focus 표현                         |
| Navigation | `Tab`, `TabList`, `Pagination`                        | 탭 위젯, URL 내비게이션과 페이지 이동                                |
| Feedback   | `Badge`, `Chip`, `ProgressBar`, `Toast`               | 상태·선택·진행률·알림의 도메인 비의존 표현                           |
| Surface    | `Card`, `BottomSheet`, `Tooltip`                      | 콘텐츠 표면, modal dialog와 컨텍스트 팝업 동작                       |
| Media      | `Icon`, `Avatar`, `AspectRatio`                       | 허용된 아이콘 이름, 프로필 이미지와 비율 컨테이너                    |

이 표는 컴포넌트 사용법의 정본이 아닙니다. 공개 props와 상태 예시는 각 Storybook 스토리를 기준으로 확인합니다.

## Molecules 2차 디자인 반영

디자인 기준은 [Fundit 디자인 시스템 유지보수 관리](https://www.figma.com/design/OJkMEDf2sY4Fkh0nSSNRXe?node-id=1-2)의 2026-09-14 내역과 Foundations입니다. 아래 컴포넌트는 디자인 시스템에 명시된 조합이므로 화면 적용에 앞서 공용으로 제공합니다. 기존 `ui` 디렉터리 구조를 유지합니다.

| Figma 페이지      | 공개 컴포넌트      | 사용 계약                                                                            |
| ----------------- | ------------------ | ------------------------------------------------------------------------------------ |
| chat              | `ChatDialogue`     | `sender`, 크기, 내용과 진행 표시. avatar·status·actions는 호출자 슬롯                |
| dropdown          | `Dropdown`         | `lg` 52px, `sm` 32px, `xs` 30px. `value`/`onValueChange`로 제어하는 listbox          |
| empty_state       | `EmptyState`       | 제목·부제·graphic·메시지·설명. graphic은 실제 화면의 에셋으로 전달                   |
| footer            | `Footer`           | 선택적인 leading과 버튼 조합. 고정 위치·safe area는 화면 책임                        |
| form_field        | `FormField`        | label·설명·action·입력 슬롯·오류 설명                                                |
| input             | `Input`            | 기본 52px·radius 4px, 오류·비활성, endAdornment 슬롯                                 |
| input_button      | `InputButton`      | 기존 Input과 버튼 슬롯의 조합. 조회·주소 검색은 호출자 책임                          |
| input_chat        | `InputChat`        | 제어 textarea, 첨부·전송 콜백. Enter 전송, Shift+Enter 줄바꿈, IME 조합 중 전송 방지 |
| list_item         | `ListItem`         | 텍스트·leading·trailing 조합. 이동은 Link로 감싸고 선택 컨트롤과 중첩하지 않음       |
| pagination        | `Pagination`       | URL 페이지 이동, 숫자 목록·counter. 경계의 이전·다음은 링크를 만들지 않음            |
| price_information | `PriceInformation` | 형식이 지정된 가격 문자열·원래 가격·설명. 할인 계산은 호출자 책임                    |
| search_field      | `SearchField`      | `md` 46px·`lg` 52px, pill 형태, 입력·지우기·비활성                                   |

- `Select`는 네이티브 select 계약을 유지합니다. Figma의 펼쳐진 옵션 메뉴가 필요한 곳에서 `Dropdown`을 사용합니다. 옵션 `value`는 목록 안에서 고유해야 합니다.
- `Input`과 `SearchField`의 기존 36px `sm`은 판매자 와이어프레임 호환용으로 유지합니다. 기존 SearchField 기본 높이는 52px에서 46px로 변경되므로 52px이 필요한 사용처는 `size="lg"`를 지정합니다.
- `FormField`의 `htmlFor`와 입력 `id`를 일치시키고, 설명·오류가 있으면 입력의 `aria-describedby`에 `<id>-description`, `<id>-error`를 연결합니다. 오류 입력에는 `error` 또는 `aria-invalid`를 함께 전달합니다.
- `InputChat`의 전송 후 초기화, 업로드, 요청 중 disabled 상태는 호출자가 결정합니다. Input·SearchField·InputChat에는 label 또는 `aria-label`을 제공합니다.
- `Footer`의 버튼은 기존 `Button appearance="cta"`를 재사용합니다. InputButton은 버튼 슬롯을 입력 높이에 맞춰 늘립니다.
- Chat 색상은 Figma와 일치시키기로 확정했습니다. AI 말풍선은 `#959595`/흰색, 사용자 말풍선은 흰색/검정과 `#959595` 테두리를 사용하며 테마에 따라 바꾸지 않습니다. 상태 문구와 액션 예제도 Figma의 검정·흰색을 유지합니다. 해당 색상은 Chat에 한정된 명시적 예외이며 전역 semantic 토큰은 수정하지 않습니다. 좁은 화면에서는 고정 160px/188px 여백 대신 콘텐츠 폭에 맞춥니다.
- Foundations의 18px Title 및 14px Body 행간 142%는 해당 Molecules의 `leading-[1.42]`로 반영했습니다. 전역 타이포·색상 및 Atoms는 수정하지 않습니다. Atoms #93의 Button·Checkbox·Radio를 조합하며, Footer 보조 액션은 Button secondary, ListItem 라디오 슬롯은 공용 Radio를 사용합니다. Chat의 기본 아바타는 Figma 전용 SVG를 유지합니다.
- 통합 검색과 펀딩 내역 화면은 `SearchField size="lg"`로 기존 52px 높이를 유지합니다. Dropdown은 disabled 전환 시 열린 상태를 닫으며 재활성화만으로 열리지 않습니다. Chat은 커스텀 avatar 여부와 관계없이 숨김 텍스트로 AI·사용자 발신자를 제공합니다.
- 아이콘은 해당 Molecules의 Figma SVG를 `public/icons/molecules`에 저장했습니다. `EmptyState`의 graphic placeholder와 Chat의 avatar는 교체 슬롯이며 서비스용 일러스트를 새로 만들지 않습니다.
- 입력 focus outline은 키보드 접근성을 위해 제공합니다. Figma Footer의 고정 60px 안에 46px 버튼과 상하 8px 여백이 함께 지정되어 있어, 코드에서는 내용이 잘리지 않도록 최소 높이로 처리합니다.
- Storybook 접근성 검사에서 기존 `text-secondary`/`text-disabled`의 회색 보조 텍스트와 `text-warning`의 오류 텍스트가 light 배경에서 대비 부족으로 보고됩니다. Dropdown placeholder, 원래 가격 및 입력 오류가 해당하며, Foundations 담당자와 토큰 조정 여부를 확인해야 합니다. 검사 설정에서 제외하지 않습니다.

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

## Organisms 공개 계약

- `HeaderWeb`은 로고·메뉴·액션 슬롯을 제공하며 구매자·판매자 Shell에서 공유합니다. 구매자 데스크톱 검색은 `/search?q=...`로 제출합니다.
- `BuyerBottomNavigation`은 현재 경로로 활성 탭을 결정하고 `activeHref`로 재정의할 수 있습니다. 카테고리 재선택 시 기존 복귀 경로를 유지합니다.
- `Calendar`는 react-day-picker의 선택 모드·선택값·disabled 계약을 그대로 받으며 기본 locale은 한국어입니다. `classNames`와 `components`는 기본값에 병합합니다. 실제 화면 연결은 호출자가 담당합니다.
- `Breadcrumb`은 텍스트 경로를 표시하고 마지막 항목에 `aria-current="page"`를 지정합니다.
- `BottomSheet`는 `title`을 주면 제목과 닫기 버튼을 표시하며 `onBack`으로 뒤로가기를 추가합니다. 헤더가 없으면 `aria-label` 또는 `aria-labelledby`를 제공합니다. 제목·하단 영역은 고정하고 본문만 스크롤합니다.
- `Modal`의 `size="m"`은 588px, `size="l"`은 996px이며 작은 화면에서는 좌우 여백을 남기도록 제한합니다.
- Navigation의 outline/filled 아이콘 전환과 Calendar 실제 화면 연동은 #90의 제외 범위입니다.
