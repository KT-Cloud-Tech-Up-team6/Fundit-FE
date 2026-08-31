export type Token = {
  name: string;
  /** 계산된 최종 값. var() 참조가 모두 풀린 상태다. (#202125) */
  value: string;
  /** 선언 원문. Semantic이면 참조가 그대로 남는다. (var(--charcoal-900)) */
  raw: string;
};

/**
 * :root에 선언된 CSS 커스텀 프로퍼티를 스타일시트에서 직접 읽는다.
 * 토큰 목록을 스토리에 복사해두면 globals.css와 어긋나므로 런타임에 읽는다.
 * globals.css에 토큰을 추가하면 갤러리에 자동으로 나타난다.
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
        const matchesRoot = rule.selectorText.split(",").some((s) => s.trim() === ":root");
        if (!matchesRoot) continue;
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
