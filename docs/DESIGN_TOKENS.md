# 디자인 토큰 설계 계획

Figma `Fundit 디자인 시스템 > Foundations`를 프론트엔드 토큰으로 옮기기 위한 설계 문서다. 이 문서는 무엇을 토큰으로 만들고 어떤 이름으로 코드에 노출할지를 정의한다. 컴포넌트 구현 방법은 다루지 않는다.

## 1. 목표와 범위

- Foundations의 Colors, Type, Shape, Shadow, Grids를 코드 토큰으로 확정한다.
- 화면 코드에서 hex, px, font-size 리터럴을 제거하고 토큰 유틸리티만 사용하게 한다.
- 범위 밖: 컴포넌트 라이브러리(button, card, input, badge 등) 구현, 다크 테마 값 확정, 아이콘 세트.

## 2. 원칙

1. **Figma와 동일하게 3계층으로 관리한다.** Primitive(값) → Semantic(역할) → Component(사용 위치).
2. **코드에서 CSS 변수로 만드는 건 Primitive와 Semantic까지다.** Component 토큰은 CSS 변수로 만들지 않고 해당 컴포넌트 파일에서 Semantic을 직접 참조한다. Component 토큰은 소비자가 컴포넌트 하나뿐이라 전역 변수로 승격해도 참조 단계만 늘고 유지비가 커진다. Figma에는 Component 계층을 그대로 두고, 코드에서는 컴포넌트 파일이 그 역할을 대신한다.
   **예외 — 대응 Semantic이 없는 상태값.** hover처럼 Figma가 Component 층에만 정의한 값은 참조할 Semantic이 없어 컴포넌트 파일이 Primitive를 직접 쓰게 되고, 그러면 3항이 깨진다. 이런 값은 Semantic으로 승격한다(7항의 `layer-surface-primary-hover` 등). 승격 기준은 "소비자가 컴포넌트 하나뿐인가"가 아니라 **"3항을 지킬 수단이 있는가"**다.
3. **화면 코드는 Semantic만 쓴다.** Primitive는 Semantic 정의부에서만 참조한다.
4. **Tailwind 기본 스케일과 겹치는 토큰은 새로 만들지 않는다.** Figma 간격 체계가 4px 배수라 Tailwind v4 기본 숫자 유틸리티와 값이 그대로 일치한다.
5. **Figma에 없는 값은 코드에서 만들지 않는다.** 필요하면 디자이너에게 토큰 추가를 요청하고, 임시로 쓸 때는 `arbitrary value`로 남겨 눈에 띄게 둔다.
6. **동기화는 수동으로 한다.** 아래 3항 참고.

### 브랜드 컬러 사용 규칙 (확정)

Blue 계열은 **LIVE 관련 컨텐츠 전용**이다. 일반 CTA와 강조는 Charcoal 계열을 쓴다.

| 용도     | 토큰                  | 값                     |
| -------- | --------------------- | ---------------------- |
| 일반 CTA | `Button/primary`      | charcoal-900 `#202125` |
| LIVE CTA | `Button/primary_live` | blue-500 `#2947e5`     |

Figma 변수의 `_live` 접미사가 이 구분을 담당한다. 따라서 4항의 초기 규칙(`_live` 제거)은 폐기하고 **접미사를 코드에도 그대로 유지한다.**

## 3. 소스와 동기화 방식

- Source of truth는 Figma Foundations 페이지(`1:4`)다.
- Figma → 코드 반영은 **수동**으로 한다. Style Dictionary, Tokens Studio, Figma Variables API 파이프라인은 도입하지 않는다.
  - 이유: 토큰 총량이 100개 미만이고 변경 빈도가 낮다. 빌드 단계와 CI 인증 설정 비용이 수동 갱신 비용보다 크다.
  - 재검토 조건: 다크 모드 등 모드가 2개 이상 되거나, 토큰 변경이 스프린트마다 발생하면 자동화한다.
- 갱신 절차: Figma 변경 → `docs/DESIGN_TOKENS.md`의 인벤토리 표 갱신 → `globals.css` 반영 → 같은 PR로 올린다.

## 4. 네이밍 규칙

| Figma                      | 코드                             | 비고                                            |
| -------------------------- | -------------------------------- | ----------------------------------------------- |
| `Blue/500_T`               | `--color-blue-500`               | `_T`(대표색 표기)는 이름에서 제외한다           |
| `Grey/pearl_white`         | `--color-grey-pearl-white`       | snake_case → kebab-case                         |
| `Text/default`             | `--color-text-default`           |                                                 |
| `Text/primary_live`        | `--color-text-primary-live`      | `_live`는 유지한다. 2항 참고                    |
| `Layer/surface_disbaled`   | `--color-layer-surface-disabled` | Figma 오타는 코드에서 교정한다                  |
| `Button/primary_hover`     | `--layer-surface-primary-hover`  | Semantic으로 승격. 2항 예외 참고                |
| `Numeric/Border/Radius/lg` | `--radius-lg`                    | `Numeric` 접두어 제거                           |
| `shadow/light_m`           | `--shadow-light-m`               |                                                 |
| Type `Body/Boby M`         | `--text-body-m`                  | Figma 오타(`Boby`)는 코드에서 `body`로 교정한다 |

`_live` 접미사는 LIVE 전용 색을 뜻하며 코드에서도 유지한다. Blue 계열은 전부 `_live`가 붙고, 일반 UI는 Charcoal 계열을 쓴다. 2항의 브랜드 컬러 사용 규칙을 참고한다.

Figma 변수명의 오타(`surface_disbaled`, `Boby`)는 코드에서 교정하되, Figma 원본이 수정되면 이 표에서 해당 행을 지운다.

## 5. Tailwind v4 매핑

Tailwind v4는 설정 파일 없이 CSS `@theme` 블록에서 토큰과 유틸리티를 동시에 정의한다. `tailwind.config.ts`는 만들지 않는다.

정의 위치는 `src/app/globals.css` 한 파일로 시작한다. 200줄을 넘으면 `src/app/tokens.css`로 분리하고 `@import`한다.

| 토큰 종류    | Tailwind 네임스페이스 | 생성되는 유틸리티            | 기본값 초기화                                          |
| ------------ | --------------------- | ---------------------------- | ------------------------------------------------------ |
| 색상         | `--color-*`           | `bg-*`, `text-*`, `border-*` | O — Tailwind 기본 팔레트 제거                          |
| 타이포       | `--text-*`            | `text-*`                     | O                                                      |
| Radius       | `--radius-*`          | `rounded-*`                  | O — 기본값과 이름이 겹치고 값이 다름                   |
| Shadow       | `--shadow-*`          | `shadow-*`                   | O                                                      |
| Border width | 없음                  | `border-*` 커스텀 유틸       | -                                                      |
| Spacing      | `--spacing`           | `p-*`, `gap-*`, `m-*`        | X — 기본 4px 스케일 사용                               |
| Breakpoint   | 없음                  | `md:`                        | X — Figma 768px과 Tailwind 기본 `md`가 일치. 6.11 참고 |

`--color-*: initial;` 같은 초기화 한 줄로 Tailwind 기본 팔레트를 제거한다. 이렇게 하면 `bg-sky-500` 같은 비-디자인시스템 클래스가 컴파일 단계에서 죽어 실수를 조기에 잡는다.

### 간격을 토큰으로 만들지 않는 이유

Figma Spacing 스케일과 Tailwind 기본 숫자 유틸리티는 값이 동일하다.

| Figma    | none  | xs    | s     | base  | md    | lg    | xl    | 2xl    | 3xl    | 4xl    | 5xl    |
| -------- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ------ | ------ | ------ | ------ |
| px       | 0     | 4     | 8     | 12    | 16    | 24    | 32    | 40     | 48     | 64     | 96     |
| Tailwind | `p-0` | `p-1` | `p-2` | `p-3` | `p-4` | `p-6` | `p-8` | `p-10` | `p-12` | `p-16` | `p-24` |

이름을 따로 만들면 두 체계를 동시에 유지해야 하고 `p-lg`와 `p-6`이 공존하는 상태가 된다. Figma 이름은 이 표에서만 참조하고 코드는 숫자 유틸리티를 쓴다.

## 6. 토큰 인벤토리

### 6.1 Primitive — Blue

| 토큰               | 값                        |
| ------------------ | ------------------------- |
| `--color-blue-50`  | `#f1f2fd`                 |
| `--color-blue-100` | `#e1e5fb`                 |
| `--color-blue-200` | `#a5b1f4`                 |
| `--color-blue-300` | `#687eec`                 |
| `--color-blue-400` | `#4963e8`                 |
| `--color-blue-500` | `#2947e5` (브랜드 대표색) |
| `--color-blue-600` | `#1733bd`                 |
| `--color-blue-700` | `#132b9b`                 |
| `--color-blue-800` | `#0f2078`                 |
| `--color-blue-900` | `#0a1756`                 |

### 6.2 Primitive — Charcoal

| 토큰                   | 값                      |
| ---------------------- | ----------------------- |
| `--color-charcoal-100` | `#eeeff0`               |
| `--color-charcoal-200` | `#dddee2`               |
| `--color-charcoal-300` | `#cdced4`               |
| `--color-charcoal-400` | `#bdbec6`               |
| `--color-charcoal-500` | `#9b9da8`               |
| `--color-charcoal-600` | `#7a7c8a`               |
| `--color-charcoal-700` | `#5c5e69`               |
| `--color-charcoal-800` | `#3f4049`               |
| `--color-charcoal-900` | `#202125` (본문 대표색) |

### 6.3 Primitive — Grey

| 토큰                          | 값        |
| ----------------------------- | --------- |
| `--color-grey-white`          | `#ffffff` |
| `--color-grey-pearl-white`    | `#f7f7f7` |
| `--color-grey-bright-grey`    | `#e4e5e8` |
| `--color-grey-grey`           | `#7a7c8a` |
| `--color-grey-medium-grey`    | `#53545c` |
| `--color-grey-dark-grey`      | `#383941` |
| `--color-grey-midnight-grey`  | `#323339` |
| `--color-grey-midnight-black` | `#1f2024` |
| `--color-grey-black`          | `#1a1a1a` |

Charcoal과 Grey는 값이 일부 겹친다(`#7a7c8a`). Figma가 두 라이브러리를 모두 운영하므로 코드에서도 그대로 두되, Semantic은 Charcoal 계열만 참조한다.

### 6.4 Primitive — Status(Live colors)

| 의미   | 기본      | 밝은 배경 | 어두운 텍스트 |
| ------ | --------- | --------- | ------------- |
| green  | `#10b834` | `#e1f6e3` | `#2d4334`     |
| red    | `#f04111` | `#ffdad0` | `#572920`     |
| orange | `#ff9500` | `#fff1cc` | `#4c3e1d`     |

Figma 레이어명(`green` / `bright_green` / `dark_green`)을 그대로 따라 `--color-green`, `--color-bright-green`, `--color-dark-green` 형태로 정의한다.

### 6.5 Primitive — Alpha

| 토큰               | 값          |
| ------------------ | ----------- |
| `--color-alpha-10` | `#0000001a` |
| `--color-alpha-30` | `#0000004d` |
| `--color-alpha-60` | `#00000099` |

### 6.6 Semantic / Component

Figma 컴포넌트 페이지(button, input, card, badge, tap, progress bar, search field)에 **실제 바인딩된 변수**를 추출한 결과다. 디자인 문서 05장의 목록보다 실제 구현이 앞서 있으므로 이쪽을 기준으로 삼는다.

Semantic(Layer/Text/Border/Status)의 확정 Light/Dark 값은 7장에 정리했다. 여기서는 Component 계층만 다룬다 — **CSS 변수로 만들지 않고 해당 컴포넌트 파일에서 Semantic을 참조한다.**

**Component — Button**

| 변수                           | Light                  | Dark                   |
| ------------------------------ | ---------------------- | ---------------------- |
| `Button/primary`               | `#202125` charcoal-900 | `#dddee2` charcoal-200 |
| `Button/primary_hover`         | `#3f4049` charcoal-800 | 동일                   |
| `Button/primary_disabled`      | `#dddee2` charcoal-200 | `#5c5e69` charcoal-700 |
| `Button/primary_live`          | `#2947e5` blue-500     | 동일                   |
| `Button/primary_live_hover`    | `#132b9b` blue-700     | 동일                   |
| `Button/primary_live_disabled` | `#dddee2` charcoal-200 | `#5c5e69` charcoal-700 |

**Component — Chip**

2026-08-27 mode-라벨 export로 정밀 대조한 결과, 이전에 기록한 Light 값 3개가 실제로는 Dark 값이 섞여 있었다 — 지난 세션에서 부분 조회한 응답이 mode를 구분 안 하고 반환한 탓이다(7장에서 `Text/disable`·`Text/primary_live`도 같은 문제였다). 아래는 정정된 값이다.

| 변수                         | Light                  | Dark                       | 비고                                  |
| ---------------------------- | ---------------------- | -------------------------- | ------------------------------------- |
| `Chip/fill_primary`          | `#dddee2` charcoal-200 | `#53545c` grey-medium-grey | **정정** — Light/Dark 뒤바뀌어 있었음 |
| `Chip/outline_primary`       | `#202125` charcoal-900 | `#dddee2` charcoal-200     | **정정**                              |
| `Chip/selected_primary`      | `#202125` charcoal-900 | `#dddee2` charcoal-200     | **정정**                              |
| `Chip/fill_primary_live`     | `#e1e5fb` blue-100     | `#45539b` blue-muted_blue  | 기존과 일치                           |
| `Chip/outline_primary_live`  | `#2947e5` blue-500     | `#4963e8` blue-400         | **정정** — Light/Dark 뒤바뀌어 있었음 |
| `Chip/selected_primary_live` | `#2947e5` blue-500     | 동일                       | 기존과 일치                           |

`#45539b`은 미등록 값이 아니었다. Primitive `blue/muted_blue` — Blue 50~900 숫자 스케일 밖에 있는 별도 명명 색이라 지난 조회에서 안 잡혔다.

**Component — Control** (신규 확인. 입력 필드류로 추정)

| 변수             | Light                  | Dark                   |
| ---------------- | ---------------------- | ---------------------- |
| `Control/border` | `#dddee2` charcoal-200 | `#5c5e69` charcoal-700 |
| `Control/fill`   | `#202125` charcoal-900 | `#dddee2` charcoal-200 |

**Component — Icon** (신규 확인)

| 변수                    | Light                  | Dark                   |
| ----------------------- | ---------------------- | ---------------------- |
| `Icon/primary`          | `#202125` charcoal-900 | `#dddee2` charcoal-200 |
| `Icon/primary_disabled` | `#7a7c8a` charcoal-600 | `#9b9da8` charcoal-500 |
| `Icon/primary_live`     | `#2947e5` blue-500     | 동일                   |

10장 P4의 `icon_default`/`icon_subtle`/`icon_primary`는 Semantic 계층 이름이라 이 Component 값과 1:1로 안 맞는다. 다만 아이콘이 실제로 쓰는 색이 뭔지는 이걸로 알 수 있다 — `primary`/`primary_disabled`/`primary_live` 3상태뿐이고 "subtle"에 대응하는 게 없다.

**Component — Navigation**

값이 없다. **변수 이름 자체가 `"아직 안 정함"`**(Figma 원본 표기 그대로)이고 값은 `#ffffff`, Light/Dark 동일하다. 우리가 못 찾은 게 아니라 디자인팀이 스스로 "미정"이라고 표시해둔 것이다 — 확정되면 다시 조회한다.

**2026-08-27 Figma Variables export로 대부분 해소됨.** `text_secondary`(charcoal-600, 두 모드 동일), `status_success`/`status_error`/`status_info`, `layer_overlay`(Elevation/dim, `alpha-60`, 두 모드 동일)가 실제로 정의돼 있었다. 7장 참고.

**아직 미정의** — 화면 구현에 필요하나 이번 export에도 없다.

`text_tertiary`, `border_focus`, `icon_default`, `icon_subtle`, `icon_primary`

`text_secondary`는 정의는 됐지만 값(`charcoal-600`, white 대비 4.14:1)이 `text_disabled`와 완전히 같고 WCAG 4.5:1에 미달한다. 값 자체가 확인 대상이다 — 10장 참고.

### 6.6b Numeric — Button / Icon

디자인 문서에 없으나 Figma `Numeric` Variable 컬렉션(2026-08-27 export, 단일 모드)에 전체 스케일이 있다. `Numeric/Number/*`(원시 숫자 스케일)를 alias해서 나온 값이다.

| Icon 변수          | 값     | Button 변수          | 값     |
| ------------------ | ------ | -------------------- | ------ |
| `Numeric/Icon/2xs` | `12px` | `Numeric/Button/2xs` | `24px` |
| `Numeric/Icon/xs`  | `16px` | `Numeric/Button/xs`  | `28px` |
| `Numeric/Icon/s`   | `20px` | `Numeric/Button/s`   | `36px` |
| `Numeric/Icon/m`   | `24px` | `Numeric/Button/m`   | `40px` |
| `Numeric/Icon/l`   | `28px` | `Numeric/Button/l`   | `46px` |
| `Numeric/Icon/xl`  | `32px` | `Numeric/Button/xl`  | `52px` |
| `Numeric/Icon/2xl` | `36px` | -                    | -      |

**CSS 변수를 만들지 않는다.** Icon 7단계 전부와 Button 5단계(`2xs/xs/s/m/xl`)가 4px 그리드에 그대로 맞아 Tailwind 기본 `w-*`/`h-*`로 표현된다 — 5항의 Spacing과 같은 이유다.

| Figma           | Tailwind | Figma             | Tailwind                 |
| --------------- | -------- | ----------------- | ------------------------ |
| `Icon/2xs` 12px | `size-3` | `Button/2xs` 24px | `h-6`                    |
| `Icon/xs` 16px  | `size-4` | `Button/xs` 28px  | `h-7`                    |
| `Icon/s` 20px   | `size-5` | `Button/s` 36px   | `h-9`                    |
| `Icon/m` 24px   | `size-6` | `Button/m` 40px   | `h-10`                   |
| `Icon/l` 28px   | `size-7` | `Button/l` 46px   | **없음** — 4px 그리드 밖 |
| `Icon/xl` 32px  | `size-8` | `Button/xl` 52px  | `h-13`                   |
| `Icon/2xl` 36px | `size-9` | -                 | -                        |

예외는 `Button/l`(46px) 하나뿐이다. Tailwind 기본 스케일에 없으니 그 컴포넌트에서 `h-[46px]`로 쓰면 된다 — 예외 하나 때문에 전체 스케일용 커스텀 네임스페이스를 만들 필요는 없다.

### 6.7 Typography

**Foundations Type 섹션의 24종을 정본으로 삼는다.** 컴포넌트에 바인딩된 변수 9종(`Body/Regular_16` 방식)은 이 스케일의 부분집합이며, 아래 3건이 어긋난다.

| 바인딩된 변수        | 실제 값                   | Foundations 대응                 | 판정                 |
| -------------------- | ------------------------- | -------------------------------- | -------------------- |
| `Body/Regular_16`    | regular 16/150            | `Body M`                         | 일치                 |
| `Body/Regular_14`    | regular 14/150            | `Body S`                         | 일치                 |
| `Body/Medium_16`     | medium 16/150             | `Body Emphasis`                  | 일치                 |
| `Label/Semibold_14`  | semibold 14/130           | `Label L`                        | 일치                 |
| `Label/Semibold_12`  | semibold 12/130           | `Label M`                        | 일치                 |
| `Caption/Regular_14` | regular 14/140            | `Caption M`                      | 일치                 |
| `Body/Semibold_16`   | **medium 500** 16/150     | `Body Strong`(semibold)          | **값 불일치**        |
| `Title/Medium_18`    | medium 18/140             | 대응 없음 (`Title S`는 semibold) | **스케일 밖**        |
| `Heading/Heading 2`  | **Noto Sans** bold 32/125 | `Heading XL`(Pretendard 32/130)  | **폰트·행간 불일치** |

**구현 토큰 (23종)**

| 토큰                  | size           | line-height | weight |
| --------------------- | -------------- | ----------- | ------ |
| `text-display-xl`     | 48 (3rem)      | 1.2         | 800    |
| `text-display-l`      | 40 (2.5rem)    | 1.2         | 800    |
| `text-display-m`      | 36 (2.25rem)   | 1.28        | 800    |
| `text-display-s`      | 28 (1.75rem)   | 1.3         | 800    |
| `text-heading-xl`     | 32 (2rem)      | 1.3         | 700    |
| `text-heading-l`      | 28 (1.75rem)   | 1.3         | 700    |
| `text-heading-m`      | 24 (1.5rem)    | 1.35        | 700    |
| `text-heading-s`      | 20 (1.25rem)   | 1.4         | 700    |
| `text-title-l`        | 24 (1.5rem)    | 1.35        | 600    |
| `text-title-m`        | 20 (1.25rem)   | 1.4         | 600    |
| `text-title-s`        | 18 (1.125rem)  | 1.4         | 600    |
| `text-title-emphasis` | 20 (1.25rem)   | 1.4         | 500    |
| `text-body-l`         | 18 (1.125rem)  | 1.6         | 400    |
| `text-body-m`         | 16 (1rem)      | 1.5         | 400    |
| `text-body-s`         | 14 (0.875rem)  | 1.5         | 400    |
| `text-body-emphasis`  | 16 (1rem)      | 1.5         | 500    |
| `text-body-strong`    | 16 (1rem)      | 1.5         | 600    |
| `text-caption-m`      | 14 (0.875rem)  | 1.4         | 400    |
| `text-caption-s`      | 13 (0.8125rem) | 1.4         | 400    |
| `text-caption-strong` | 12 (0.75rem)   | 1.35        | 600    |
| `text-label-l`        | 14 (0.875rem)  | 1.3         | 600    |
| `text-label-m`        | 12 (0.75rem)   | 1.3         | 600    |
| `text-label-s`        | 11 (0.6875rem) | 1.3         | 600    |

Figma의 24종 중 `Caption Emphasis`는 정의하지 않았다. `Caption S`와 값이 완전히 같다(regular 13/140%). 확인 후 추가한다.

Tailwind v4의 `--text-*--line-height` / `--text-*--font-weight` 짝을 써서 세 값을 한 유틸리티로 묶었다. `--text-*: initial`로 기본 스케일(`text-sm`, `text-base` 등)을 제거했으므로 **스케일 밖 크기는 컴파일되지 않는다.** `text-body-m font-bold`처럼 나눠 쓸 수 없고, 나눠 쓸 필요도 없다.

크기는 rem으로 정의한다. 사용자 브라우저 글자 크기 설정을 따르기 위해서다. 괄호 안 숫자가 Figma의 px 값이다.

### 6.7b 폰트 로딩

**Pretendard Variable 단일 파일을 자체 호스팅한다.**

| 항목         | 값                                                     |
| ------------ | ------------------------------------------------------ |
| 버전         | 1.3.9 (SIL OFL 1.1)                                    |
| 폰트 파일    | `public/fonts/PretendardVariable.woff2` (2.0MB)        |
| `@font-face` | `src/app/globals.css` 상단 (1개, `font-display: swap`) |
| weight 축    | 45~920 가변                                            |

**npm 의존성으로 추가하지 않았다.** `pretendard` 패키지는 97MB라 모든 설치에 부담을 준다. 필요한 정적 파일만 복사했다.

이전에는 `unicode-range` dynamic subset(92개 청크)으로 갔다. 홈 화면 기준 8개 청크 204KB만 전송돼 전송량은 더 작았지만, 청크 수가 많아 관리 부담이 있어 **단일 파일로 되돌렸다.** 첫 로드 시 2.0MB를 한 번에 받는 트레이드오프가 있다. 초기 로딩이 문제가 되면 dynamic subset 재도입을 검토한다.

### 6.8 Radius

**해결됨.** Figma `Numeric` Variable 컬렉션의 `Numeric/Radius/*`가 `Numeric/Number/*`를 alias한 공식 스케일이다. Foundations Shape 문서(`xs=8, sm=10`)는 이 공식 컬렉션과 값이 달라 낡은 문서로 판단하고, `Numeric` 컬렉션을 기준으로 삼는다.

| 토큰            | 값       | Figma                 |
| --------------- | -------- | --------------------- |
| `--radius-none` | `0`      | `Numeric/Radius/none` |
| `--radius-xs`   | `4px`    | `Numeric/Radius/xs`   |
| `--radius-sm`   | `8px`    | `Numeric/Radius/sm`   |
| `--radius-md`   | `12px`   | `Numeric/Radius/md`   |
| `--radius-lg`   | `24px`   | `Numeric/Radius/lg`   |
| `--radius-full` | `9999px` | `Numeric/Radius/full` |

디자인 방향은 "Soft + Structured + Flat", 기본 사용 범위는 8~12px다. `--radius-none`은 값이 `0`이라 Tailwind 기본 `rounded-none`과 동일해 별도 CSS 변수를 안 만들었다.

### 6.9 Border width

| 유틸리티      | 값      | Figma               |
| ------------- | ------- | ------------------- |
| `border-w-xs` | `1px`   | `Numeric/Border/xs` |
| `border-w-s`  | `1.3px` | `Numeric/Border/s`  |
| `border-w-m`  | `1.5px` | `Numeric/Border/m`  |
| `border-w-l`  | `1.8px` | `Numeric/Border/l`  |
| `border-w-xl` | `2px`   | 없음 — 6.9a 참고    |

Tailwind에 border-width 네임스페이스가 없어 `@utility`로 직접 정의한다.

**`border-w-` 접두어를 쓴다.** Figma 이름 그대로 `border-s` / `border-l`로 정의하면 Tailwind 기본 `border-inline-start-width` / `border-left-width`를 덮어쓴다. 실제로 `.border-l{border-width:1.8px}`가 생성되는 것을 확인했다.

### 6.9a `border-w-xl`(2px)과 방향별 변형

`Numeric/Border` 컬렉션에는 2px가 없는데 판매자 프로젝트 목록(`FL_S_PR_LIST`)의 탭 인디케이터 트랙이 2px다. 스케일 밖 값을 `border-b-2` 리터럴로 두는 대신 `border-w-xl`을 추가했다. **Figma 변수 쪽에도 `Numeric/Border/xl` 추가를 요청해야 한다** — 현재는 코드에만 있는 값이다.

`@utility border-w-*`는 네 방향을 한꺼번에 지정한다. 한 방향만 필요하면 `border-b-w-xl`처럼 방향별 변형이 필요한데, **실제 소비자가 생긴 단계에만 만든다.** 지금은 `border-b-w-xl` 하나뿐이다. `tab.tsx`가 `border-b-[1.5px]` / `border-b-[1.8px]`를 arbitrary로 쓰고 있는 것도 같은 이유이며, 이 컴포넌트를 손볼 때 `border-b-w-m` / `border-b-w-l`을 함께 만든다.

### 6.10 Shadow

| 토큰               | offset | blur | spread | color    |
| ------------------ | ------ | ---- | ------ | -------- |
| `--shadow-light-s` | 1 / 1  | 2    | 0      | alpha-10 |
| `--shadow-light-m` | 1 / 2  | 8    | 0      | alpha-10 |
| `--shadow-light-l` | 1 / 4  | 12   | 0      | alpha-10 |
| `--shadow-dark-s`  | 1 / 1  | 2    | 0      | alpha-30 |
| `--shadow-dark-m`  | 1 / 2  | 8    | 0      | alpha-30 |
| `--shadow-dark-l`  | 1 / 4  | 12   | 0      | alpha-30 |

`light` / `dark`는 테마가 아니라 그림자 농도다. 다크 모드와 무관하다.

### 6.11 Grid

| 항목           | mobile     | desktop |
| -------------- | ---------- | ------- |
| 기준 프레임    | 390px      | 1440px  |
| margin         | 20px       | -       |
| gutter         | 24px       | 24px    |
| column         | 4 (일부 3) | 12      |
| column width   | -          | 70px    |
| 콘텐츠 최대 폭 | 350px      | 1200px  |
| 적용 상한      | ~768px     | ~1920px |

`--container-content: 1200px` 하나만 토큰으로 만들고 나머지는 레이아웃 컴포넌트(`BuyerShell`, `SellerShell`)가 직접 소유한다. Grid는 값이 아니라 레이아웃 규칙이라 토큰화 효용이 낮다.

브레이크포인트 768px은 Tailwind 기본 `md`(768px)와 일치하므로 별도 정의하지 않는다.

## 7. 다크 모드

**완료.** 디자인팀이 Figma Variables export(mode 라벨 포함 JSON, 2026-08-27)를 제공해 Semantic 전 토큰의 Light/Dark 값을 확정했다. `[data-theme="dark"]` 속성으로 구현했다.

### 왜 `[data-theme]`이고 `prefers-color-scheme`가 아닌가

테마 토글 UI가 아직 없다. `prefers-color-scheme`만 쓰면 OS를 다크로 설정한 사용자에게 검증 안 된 배색이 토글 없이 오늘부터 강제로 나간다. `[data-theme="dark"]`는 아무도 속성을 안 건드리면 항상 Light이므로, 토글이 없는 지금 상태에서 다크 토큰만 미리 준비해두기에 안전하다. 나중에 설정 화면에 토글이 생기면 `document.documentElement.dataset.theme = "dark"` 한 줄로 켜진다. `prefers-color-scheme`를 "시스템 설정 따르기" 옵션으로 나중에 병행할 수는 있다 — 그 자체가 토글 UI가 나온 다음 얘기라 지금은 범위 밖이다.

### 확정 값

Primitive는 그대로, Semantic만 모드에 따라 값이 바뀐다. 두 모드에서 값이 같은 토큰(`text-secondary`, `text-warning/success/error/info`, `border-accent-*`, `static-*`, `layer-overlay`)은 재정의하지 않는다 — `:root`에 한 번만 있으면 두 모드에 다 적용된다.

| 토큰                               | Light              | Dark                  |
| ---------------------------------- | ------------------ | --------------------- |
| `layer-bg`                         | `grey-pearl-white` | `grey-midnight-black` |
| `layer-surface-default`            | `grey-white`       | `grey-midnight-grey`  |
| `layer-surface-disabled`           | `charcoal-100`     | `charcoal-700`        |
| `layer-surface-primary`            | `charcoal-900`     | `charcoal-200`        |
| `layer-surface-primary-live`       | `blue-500`         | 동일                  |
| `layer-surface-primary-hover`      | `charcoal-800`     | 동일                  |
| `layer-surface-primary-live-hover` | `blue-700`         | 동일                  |
| `text-title`                       | `grey-black`       | `grey-white`          |
| `text-default`                     | `charcoal-900`     | `charcoal-100`        |
| `text-disabled`                    | `charcoal-600`     | `charcoal-500`        |
| `text-inverse`                     | `grey-white`       | `charcoal-900`        |
| `text-primary-live`                | `blue-500`         | `blue-200`            |
| `border-default`                   | `charcoal-200`     | `charcoal-700`        |
| `border-primary`                   | `charcoal-900`     | `charcoal-200`        |
| `border-primary-live`              | `blue-500`         | `blue-300`            |
| `status-warning`                   | `bright-red`       | `dark-red`            |
| `status-success`                   | `bright-green`     | `dark-green`          |
| `status-error`                     | `bright-orange`    | `dark-orange`         |
| `status-info`                      | `grey-bright-grey` | `grey-dark-grey`      |

`layer-surface-primary-live`, `text-warning/success/error/info`, `border-accent-*`는 두 모드에서 값이 같다 — 확정 색이라 테마와 무관하게 고정한 것으로 보인다.

`layer-surface-primary-hover`(charcoal-800)와 `layer-surface-primary-live-hover`(blue-700)도 Figma 6.6 표가 Dark를 "동일"로 적어 두 모드 공통으로 뒀다. **다만 Dark에서 `layer-surface-primary`가 charcoal-200(밝은색)으로 뒤집히는데 hover만 charcoal-800(어두운색)으로 남으면 hover 시 명암이 역전된다.** Figma 값 그대로 반영했으나 다크 모드 토글이 생기기 전에 디자인 확인이 필요하다.

**대비 재검증.** Dark 값이 처음 나왔을 때 `text-primary-live`(blue-500 유지 추정)가 다크 배경에서 1.87:1로 실패한다고 잠정 결론 냈었는데, 실제 export를 정밀 대조하니 Dark는 blue-200으로 바뀌어 있었다 — 그 추정은 export 이전의 부분 조회 데이터를 잘못 해석한 것이었다. 실제 Dark 값 전부 재계산 결과:

| 조합                                       | 대비    | 결과            |
| ------------------------------------------ | ------- | --------------- |
| `text-primary-live`(blue-200) on dark bg   | 6.11:1  | PASS            |
| `border-primary-live`(blue-300) on dark bg | 3.47:1  | PASS (3:1 기준) |
| `text-disabled`(charcoal-500) on dark bg   | 4.66:1  | PASS            |
| `text-default`(charcoal-100) on dark bg    | 14.14:1 | PASS            |

Dark 모드는 정의된 조합 전부 WCAG를 통과한다.

### 새로 발견된 토큰

export에서 이전에 몰랐던 Semantic이 확인됐다: `Text/title`, `Text/static_black`, `Text/success`, `Text/error`, `Text/info`, `Border/accent_success`, `Border/accent_error`, `Border/accent_info`, `Elevation/dim`(→ `layer-overlay`). `Elevation/shadow`(Light: alpha-10, Dark: alpha-30)는 이미 있는 `shadow-light-*`/`shadow-dark-*` 조합과 같은 값을 가리켜 별도 토큰을 만들지 않았다 — 지금 이걸 쓸 컴포넌트가 없다. 필요해지면 그때 추가한다.

### 구현

Primitive는 `:root`에 한 번만 정의하고, Semantic Light 기본값도 `:root`에 두고, 바뀌는 값만 `[data-theme="dark"]`에서 재정의한다. `@theme inline`으로 Tailwind 유틸리티가 CSS 변수를 통해 간접 참조하므로, `[data-theme="dark"]`가 걸리면 별도 재빌드 없이 같은 클래스(`bg-layer-bg` 등)가 새 값을 그대로 반영한다. 브라우저에서 `document.documentElement.setAttribute('data-theme','dark')` 실행으로 검증했다.

Storybook 토큰 갤러리(`src/shared/design-tokens/`)는 아직 `[data-theme]` 토글을 갖고 있지 않아 Light 값만 보여준다 — 다크 프리뷰가 필요해지면 `read-tokens.ts`의 `:root` 스캔에 `[data-theme="dark"]` 셀렉터를 추가하고 배경 툴바에 토글을 연결한다.

## 8. 적용 단계

| 단계   | 내용                                                                                                             | 산출물                              |
| ------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| ~~P1~~ | ~~Primitive 색상 전체 + Semantic(6.6의 Light 값) + Radius + Shadow + Border 정의, 기존 임시 토큰 제거~~ **완료** | `globals.css`, `src/**` (11개 파일) |
| ~~P2~~ | ~~Pretendard 폰트 적용, Typography 정의~~ **완료**                                                               | `globals.css`                       |
| ~~P3~~ | ~~Dark 값 확보 후 `[data-theme="dark"]` Semantic 재정의~~ **완료**                                               | `globals.css`                       |
| P4     | 미정의 Semantic 역할(6.6) 확정 후 추가                                                                           | `globals.css`, 본 문서 6.6 갱신     |
| ~~P5~~ | ~~기존 화면의 하드코딩 색상·크기를 토큰 유틸리티로 치환~~ **P1에 흡수**                                          | -                                   |

P5는 P1에 흡수했다. 임시 토큰을 제거하면 11개 파일이 깨지므로 alias 토큰을 남기거나 화면을 함께 치환해야 하는데, 대상이 13줄뿐이라 한 번에 처리하는 쪽이 총 diff가 짧았다.

P2에서 막혀 있던 결정 2건은 아래와 같이 정했다. 디자인 확인 후 뒤집을 수 있다.

- **폰트 호스팅**: 단일 variable woff2 자체 호스팅. 6.7b 참고.
- **타이포 체계**: Foundations 24종이 정본. 바인딩된 변수 9종은 부분집합으로 보고 어긋난 3건을 확인 대상으로 남겼다. 6.7 참고.

P3는 디자이너가 준 mode별 Variables export(2026-08-27)로 완료했다. 7장 참고. P4는 남은 미정의 역할(`text_tertiary`, `border_focus`, `icon_*`) 확정이 선행돼야 한다.

### P1에서 적용한 치환 규칙

| 기존                                      | 변경                        | 근거                                |
| ----------------------------------------- | --------------------------- | ----------------------------------- |
| `bg-brand`, `bg-slate-900/950`            | `bg-layer-surface-primary`  | 일반 CTA는 charcoal-900 (2항 확정)  |
| `text-brand`, `text-brand-strong`         | `text-text-default`         | 같음                                |
| `text-white`                              | `text-text-inverse`         |                                     |
| `bg-surface`                              | `bg-layer-surface-default`  |                                     |
| `bg-slate-100/200`                        | `bg-layer-surface-disabled` |                                     |
| `bg-slate-50`, `from-teal-50 to-amber-50` | `bg-layer-bg`               | teal·amber는 팔레트에 없다          |
| `border-line`, `border-slate-300`         | `border-border-default`     |                                     |
| `border-brand`                            | `border-border-primary`     |                                     |
| `text-muted`                              | `text-text-secondary`       | 잠정 토큰. 6.6 참고                 |
| `shadow-sm`                               | `shadow-light-s`            |                                     |
| `rounded-xl/2xl/3xl`                      | `rounded-md` (12px)         | 스캐폴드 기본값. 디자인 기준 8~12px |

## 9. 검증

토큰 우회를 막는 최소 장치로 CI 검증 워크플로에 아래 한 줄을 추가한다.

```bash
! grep -rIEn '#[0-9a-fA-F]{3,8}\b' src/ --include='*.tsx' --include='*.ts'
```

`globals.css`만 hex를 가질 수 있고 컴포넌트에는 없어야 한다. 별도 lint 플러그인은 도입하지 않는다.

## 9b. Storybook

토큰 갤러리를 Storybook으로 제공한다.

```bash
pnpm storybook
```

| 항목       | 값                                                   |
| ---------- | ---------------------------------------------------- |
| 버전       | Storybook 10.5.10                                    |
| 프레임워크 | `@storybook/nextjs-vite`                             |
| addon      | `addon-a11y`, `addon-docs`                           |
| 설정       | `.storybook/main.ts`, `.storybook/preview.tsx`       |
| 스토리     | `src/shared/design-tokens/design-tokens.stories.tsx` |

`@storybook/nextjs`(webpack) 대신 `nextjs-vite`를 쓴다. 이 프로젝트는 Turbopack을 쓰므로 Storybook 때문에 webpack을 끌어올 이유가 없다.

`init`이 기본으로 넣는 `@chromatic-com/storybook`, `@storybook/addon-vitest`, `@storybook/addon-mcp`, `vitest`, `playwright`는 제거했다. Chromatic은 계약하지 않은 외부 서비스이고, `addon-vitest`는 Playwright 브라우저 바이너리까지 끌어온다. 필요해지면 `pnpm add -D @storybook/addon-vitest`로 되돌린다.

### 토큰을 스토리에 복사하지 않는다

`src/shared/design-tokens/read-tokens.ts`가 `document.styleSheets`를 훑어 `:root`의 커스텀 프로퍼티를 런타임에 읽는다. 토큰 목록을 스토리에 적어두면 `globals.css`와 어긋나므로 값을 두 곳에 두지 않는다. **`globals.css`에 토큰을 추가하면 갤러리에 자동으로 나타난다.**

이 때문에 `@theme inline`을 둘로 나눴다.

| 블록            | 대상                      | 이유                                                                                 |
| --------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| `@theme inline` | 색상                      | mode에 따라 `:root` 변수를 갈아끼워야 한다                                           |
| `@theme static` | 타이포·radius·shadow·font | `static`은 사용 여부와 무관하게 모든 변수를 `:root`로 내보낸다. 갤러리가 이를 읽는다 |

`static` 없이는 실제로 쓰인 토큰만 `:root`에 나와서 갤러리가 비어 보인다.

스타일시트를 훑을 때 `@layer`와 `@media` 안에 중첩된 규칙까지 재귀로 들어간다. Tailwind는 테마 변수를 `@layer theme` 안에 넣으므로 최상위만 보면 찾지 못한다. P3에서 `.dark {}`를 미디어쿼리 안에 두더라도 같은 코드로 읽힌다.

## 10. 확인이 필요한 항목

### 확정됨

| 항목         | 결정                                                                             |
| ------------ | -------------------------------------------------------------------------------- |
| Layer 2 명칭 | `Semantic`으로 통일한다. 디자인 문서의 `Productive` / `Sementic` 표기는 폐기한다 |
| 일반 CTA 색  | charcoal-900 `#202125`. Blue는 LIVE 전용이며 `_live` 접미사로 구분한다           |
| 다크 모드    | Figma Variable Mode 존재를 확인했다. 구현 범위에 포함한다                        |

### 디자인 확인 필요

| 우선순위 | 항목                                  | 내용                                                                                                                                                                                                                                                          |
| -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | `text-disabled`/`text-secondary` 대비 | 둘 다 charcoal-600 `#7a7c8a`, white 대비 4.14:1로 WCAG 4.5:1 미달. 실사용 최악 조합은 `layer-bg`(pearl-white) 위 **3.86:1** — page-placeholder 히어로 설명문. 2026-08-27 export로 Figma 공식값임이 확정됐다. 두 토큰이 같은 값을 쓰는 것도 의도인지 확인 필요 |
| P0       | Status 명명                           | `Status/warning`이 bright-red, `Status/error`가 bright-orange다. Text·Border 그룹도 동일 패턴 — warning↔red, error↔orange가 두 모드에 걸쳐 일관되게 반대로 매핑돼 있다. 표준 관례(warning=주황/error=빨강)와 반대인 게 의도인지 확인 필요                     |
| P1       | 변수명 오타                           | `Layer/surface_disbaled` → `disabled`, `Text/disable` → `disabled`                                                                                                                                                                                            |
| P1       | 타이포 체계                           | Foundations Type(24종, `body_m` 방식)과 실제 변수(9종, `Body/Regular_16` 방식)가 별개로 존재한다                                                                                                                                                              |
| P1       | `Body/Semibold_16`                    | 이름은 Semibold(600)인데 실제 값은 Medium(500)이다. `Body/Medium_16`과 값이 완전히 같다                                                                                                                                                                       |
| P1       | 미정의 Semantic                       | `text_tertiary`, `border_focus`, `icon_default`, `icon_subtle`, `icon_primary` — 6.6 참고. Component `Icon/*`은 확인됐으나 "subtle"에 대응하는 상태가 없다                                                                                                    |
| P2       | `Navigation` 컴포넌트                 | Figma에 아직 색이 없다. 변수명이 `"아직 안 정함"`으로 디자인팀이 직접 표시해뒀다 — 확정되면 재조회한다                                                                                                                                                        |
| P2       | Charcoal vs Grey                      | 두 계열의 사용 구분 기준. `#7a7c8a` 값이 중복된다                                                                                                                                                                                                             |
| P2       | Heading 중복                          | Foundations에서 `Heading XL`이 32/130과 28/130 두 개로 표기돼 있다                                                                                                                                                                                            |
| P2       | 폰트                                  | Pretendard 자체 호스팅 여부와 서브셋 범위. `Heading/Heading 2`만 Noto Sans에 바인딩된 것이 의도인지                                                                                                                                                           |

## 11. 접근성 실측 결과

WCAG 2.1 기준(일반 텍스트 4.5:1, Large Text 및 UI Component 3:1)으로 검증했다.

| 조합                                            | 대비       | 결과     |
| ----------------------------------------------- | ---------- | -------- |
| charcoal-900 on white                           | 16.08:1    | PASS     |
| charcoal-900 on pearl-white                     | 15.01:1    | PASS     |
| charcoal-700 on white                           | 6.44:1     | PASS     |
| **charcoal-600 on white**                       | **4.14:1** | **FAIL** |
| **charcoal-600 on pearl-white**                 | **3.86:1** | **FAIL** |
| charcoal-500 on white                           | 2.70:1     | FAIL     |
| blue-500 on white                               | 6.72:1     | PASS     |
| white on `Button/primary` (charcoal-900)        | 16.08:1    | PASS     |
| white on `Button/primary_live` (blue-500)       | 6.72:1     | PASS     |
| white on `Button/primary_live_hover` (blue-700) | 11.37:1    | PASS     |
| green `#10b834` 텍스트 on white                 | 2.65:1     | FAIL     |
| red `#f04111` 텍스트 on white                   | 3.84:1     | FAIL     |
| orange `#ff9500` 텍스트 on white                | 2.20:1     | FAIL     |
| dark-green on bright-green                      | 9.42:1     | PASS     |
| dark-red on bright-red                          | 9.29:1     | PASS     |
| dark-orange on bright-orange                    | 9.29:1     | PASS     |
| dark: charcoal-100 on midnight-grey             | 10.93:1    | PASS     |

이 표를 처음 만들 때 "다크에서도 blue-500이 유지된다"고 가정하고 1.87:1 실패로 기록했었다. 2026-08-27 export로 확인해 보니 그 가정이 틀렸다 — 실제로는 Dark에서 blue-200으로 바뀌어 있었고(6.11:1 PASS), Dark 모드 조합은 7장에 전부 재계산해 정리했다. 아래 판정에서도 해당 문장을 지웠다.

### 판정

- Status Base 색(green, red, orange)은 **텍스트에 사용하지 않는다.** 아이콘과 인디케이터 전용이다. 상태 텍스트는 Bright 배경 + Dark 전경 조합을 쓴다. 이 조합은 9.3:1 안팎으로 안전하다.
- 다크 모드 값은 Figma가 실제로 blue-200/blue-300으로 적절히 밝혀둬서(7장 참고) 별도 교체가 필요 없었다.
- `Border/default`(charcoal-200, 1.34:1)는 단순 구분선이므로 WCAG 3:1 대상이 아니다. 다만 **입력 필드 경계와 포커스 링은 3:1 이상**이 필요하므로 `border_focus`를 별도로 신설해야 한다.
