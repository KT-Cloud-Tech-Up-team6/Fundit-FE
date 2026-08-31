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

/** 규칙 셀렉터가 지금 루트 엘리먼트에 적용되는지. 잘못된 셀렉터면 무시한다. */
function rootMatches(selectorText: string): boolean {
  try {
    return selectorText.length > 0 && document.documentElement.matches(selectorText);
  } catch {
    return false; // 의사요소 등 matches()가 던지는 셀렉터
  }
}

/**
 * :root에 선언된 CSS 커스텀 프로퍼티를 스타일시트에서 직접 읽는다.
 * 토큰 목록을 스토리에 복사해두면 globals.css와 어긋나므로 런타임에 읽는다.
 * globals.css에 토큰을 추가하면 갤러리에 자동으로 나타난다.
 *
 * 활성 테마를 따른다. `document.documentElement`에 매칭되는 규칙만 모으므로
 * dark일 때는 [data-theme="dark"] 재정의가 :root 선언을 덮는다(소스 순서 = 캐스케이드).
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
        if (!rootMatches(rule.selectorText)) continue;
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
