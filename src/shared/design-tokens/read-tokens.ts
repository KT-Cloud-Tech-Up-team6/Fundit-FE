export type Token = {
  name: string;
  /** 계산된 최종 값. var() 참조가 모두 풀린 상태다. (#202125) */
  value: string;
  /**
   * 선언 원문. Semantic이면 참조가 그대로 남는다. (var(--charcoal-900))
   * 현재 활성 테마 기준이다 — dark일 때는 [data-theme="dark"] 재정의를 반영한다.
   */
  raw: string;
};

/**
 * 이 규칙이 "토큰 선언 위치"인지. globals.css는 `:root`(light)와
 * `[data-theme="dark"]`만 쓰고, Tailwind `@theme` 출력은 `:root, :host`다.
 * `*`(Tailwind 내부 --tw-* 기본값)처럼 넓은 셀렉터는 걸러내서
 * 인벤토리에 Tailwind 구현 변수가 섞이지 않게 한다.
 *
 * 활성 테마만 반영한다 — dark가 아니면 `[data-theme="dark"]` 선언은 무시.
 */
function isTokenRootSelector(selectorText: string): boolean {
  const theme = document.documentElement.dataset.theme;
  return selectorText.split(",").some((part) => {
    const s = part.trim();
    if (s === ":root" || s === ":host") return true;
    // [data-theme="dark"] / :root[data-theme=dark] (따옴표는 브라우저마다 다름)
    const match = /^(?::root)?\[data-theme=["']?([\w-]+)["']?\]$/.exec(s);
    return match !== null && match[1] === theme;
  });
}

/**
 * :root(+ 활성 테마 셀렉터)에 선언된 CSS 커스텀 프로퍼티를 스타일시트에서 직접 읽는다.
 * 토큰 목록을 스토리에 복사해두면 globals.css와 어긋나므로 런타임에 읽는다.
 * globals.css에 토큰을 추가하면 갤러리에 자동으로 나타난다.
 *
 * 활성 테마를 따른다. dark일 때는 [data-theme="dark"] 재정의가 :root 선언을
 * 덮는다(소스 순서 = 캐스케이드).
 *
 * ponytail: 캐시하지 않는다. 규칙 수십 개를 훑는 비용이 무시할 수준이고,
 * 캐시하면 globals.css를 고쳤을 때 HMR에서 값이 낡는다.
 */
export function readTokens(): Token[] {
  if (typeof document === "undefined") return [];

  const computed = getComputedStyle(document.documentElement);
  const declared = new Map<string, string>();

  // @layer / @media 안에 중첩된 규칙까지 훑는다.
  // Tailwind는 테마 변수를 @layer theme 안에 넣으므로 top-level 스캔으로는 못 찾는다.
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        if (!isTokenRootSelector(rule.selectorText)) continue;
        for (const prop of Array.from(rule.style)) {
          if (prop.startsWith("--")) {
            declared.set(prop, rule.style.getPropertyValue(prop).trim());
          }
        }
      } else if ("cssRules" in rule) {
        walk((rule as CSSGroupingRule).cssRules);
      }
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules);
    } catch {
      continue; // cross-origin 스타일시트는 읽을 수 없다
    }
  }

  return [...declared.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([name, raw]) => ({
      name,
      raw,
      value: computed.getPropertyValue(name).trim(),
    }));
}

export const isColor = (value: string) => CSS.supports("color", value);

/** Semantic 선언이 참조하는 Primitive 이름. 직접 값이면 null. */
export function referencedPrimitive(raw: string): string | null {
  const match = /^var\(\s*--([\w-]+)\s*\)$/.exec(raw);
  return match ? match[1] : null;
}
