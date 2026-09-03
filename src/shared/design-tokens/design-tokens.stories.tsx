import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";

import {
  PRIMITIVE_GROUPS,
  SEMANTIC_GROUPS,
  STATUS_ROWS,
  type PrimitiveGroup,
} from "./color-groups";
import { isColor, readTokens, referencedPrimitive, type Token } from "./read-tokens";

const meta = {
  title: "Design Tokens",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="p-6">
      <h2 className="text-heading-s text-text-default">{title}</h2>
      {note ? <p className="text-body-s text-text-secondary mt-1">{note}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** 반투명 색이 보이도록 체커보드를 깐다. */
const CHECKER = {
  backgroundImage:
    "linear-gradient(45deg,#0000000d 25%,transparent 25%),linear-gradient(-45deg,#0000000d 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#0000000d 75%),linear-gradient(-45deg,transparent 75%,#0000000d 75%)",
  backgroundSize: "12px 12px",
  backgroundPosition: "0 0,0 6px,6px -6px,-6px 0",
};

function Chip({
  token,
  label,
  role,
  height = "h-16",
}: {
  token: Token;
  label: string;
  role?: string;
  height?: string;
}) {
  const reference = referencedPrimitive(token.raw);
  return (
    <div className="border-w-xs border-border-default bg-layer-surface-default overflow-hidden rounded-sm">
      <div style={CHECKER}>
        <div className={height} style={{ background: token.value }} />
      </div>
      <div className="p-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-label-m text-text-default">{label}</p>
          {role ? <span className="text-caption-s text-text-primary-live">{role}</span> : null}
        </div>
        <p className="text-caption-s text-text-secondary mt-1">{token.value}</p>
        {reference ? <p className="text-caption-s text-text-secondary">→ {reference}</p> : null}
      </div>
    </div>
  );
}

function Family({ group, tokens }: { group: PrimitiveGroup; tokens: Token[] }) {
  const inGroup = tokens.filter((t) => t.name.startsWith(group.prefix));
  const ordered = group.order
    ? [
        ...group.order.flatMap((n) => inGroup.filter((t) => t.name === n)),
        ...inGroup.filter((t) => !group.order!.includes(t.name)),
      ]
    : inGroup;

  if (ordered.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-title-s text-text-default">{group.title}</h3>
      <p className="text-caption-m text-text-secondary">{group.subtitle}</p>
      <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
        {ordered.map((token) => (
          <li key={token.name}>
            <Chip
              token={token}
              label={token.name.replace(group.prefix, "")}
              role={group.roles?.[token.name]}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusMatrix({ tokens }: { tokens: Token[] }) {
  const find = (name: string) => tokens.find((t) => t.name === name);
  return (
    <div className="mt-6">
      <h3 className="text-title-s text-text-default">Status</h3>
      <p className="text-caption-m text-text-secondary">
        Base는 아이콘과 인디케이터 전용이다. 텍스트에는 Bright 배경 위에 Dark를 쓴다.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse">
          <thead>
            <tr className="text-label-m text-text-secondary">
              {["Category", "Base", "Bright", "Dark", "예시"].map((h) => (
                <th key={h} className="border-border-default border-b p-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STATUS_ROWS.map((row) => {
              const bright = find(row.bright);
              const dark = find(row.dark);
              return (
                <tr key={row.category} className="align-top">
                  <td className="border-border-default border-b p-3">
                    <p className="text-body-strong text-text-default">{row.category}</p>
                    <p className="text-caption-s text-text-secondary">{row.usage}</p>
                  </td>
                  {[row.base, row.bright, row.dark].map((name) => {
                    const token = find(name);
                    return (
                      <td key={name} className="border-border-default border-b p-3">
                        {token ? (
                          <Chip token={token} label={name.replace("--", "")} height="h-10" />
                        ) : null}
                      </td>
                    );
                  })}
                  <td className="border-border-default border-b p-3">
                    {bright && dark ? (
                      <span
                        className="text-label-m inline-block rounded-full px-3 py-1"
                        style={{
                          background: bright.value,
                          color: dark.value,
                        }}
                      >
                        {row.category}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Colors: Story = {
  render: () => {
    // --color-* 는 Tailwind가 @theme inline에서 만든 미러 변수다.
    // Semantic 토큰과 값이 같으므로 갤러리에서 제외한다.
    const tokens = readTokens().filter((t) => isColor(t.value) && !t.name.startsWith("--color-"));
    const primitivePrefixes = PRIMITIVE_GROUPS.map((g) => g.prefix);
    const statusNames = STATUS_ROWS.flatMap((r) => [r.base, r.bright, r.dark]);

    const semanticGroups = SEMANTIC_GROUPS.map((group) => ({
      ...group,
      items: tokens.filter((t) => t.name.startsWith(group.prefix)),
    })).filter((g) => g.items.length > 0);

    const ungrouped = tokens.filter(
      (t) =>
        !primitivePrefixes.some((p) => t.name.startsWith(p)) &&
        !statusNames.includes(t.name as (typeof statusNames)[number]) &&
        !SEMANTIC_GROUPS.some((g) => t.name.startsWith(g.prefix)),
    );

    return (
      <>
        <Section
          title="Primitive"
          note="브랜드의 기본 색상값이다. 화면 코드에서 직접 쓰지 않고 Semantic 정의부에서만 참조한다."
        >
          {PRIMITIVE_GROUPS.map((group) => (
            <Family key={group.title} group={group} tokens={tokens} />
          ))}
          <StatusMatrix tokens={tokens} />
        </Section>

        <Section
          title="Semantic"
          note="색이 UI에서 어떤 역할을 하는지 정의한다. 화면과 컴포넌트는 이 토큰만 쓴다. 화살표는 참조하는 Primitive다."
        >
          {semanticGroups.map((group) => (
            <div key={group.title} className="mt-6">
              <h3 className="text-title-s text-text-default">{group.title}</h3>
              <p className="text-caption-m text-text-secondary">{group.subtitle}</p>
              <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3">
                {group.items.map((token) => (
                  <li key={token.name}>
                    <Chip token={token} label={token.name.replace("--", "")} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {ungrouped.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-title-s text-text-warning">분류되지 않음</h3>
              <p className="text-caption-m text-text-secondary">
                color-groups.ts의 분류에 없는 토큰이다. 그룹을 추가해야 한다.
              </p>
              <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3">
                {ungrouped.map((token) => (
                  <li key={token.name}>
                    <Chip token={token} label={token.name.replace("--", "")} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      </>
    );
  },
};

export const Typography: Story = {
  render: () => {
    const tokens = readTokens();
    const scale = tokens.filter((t) => t.name.startsWith("--text-") && t.value.endsWith("rem"));
    const get = (name: string) => tokens.find((t) => t.name === name)?.value ?? "";

    return (
      <Section
        title="Typography"
        note="Pretendard Variable. 한 유틸리티가 size · line-height · weight를 함께 갖는다."
      >
        <ul className="flex flex-col gap-6">
          {scale.map(({ name, value }) => {
            const lineHeight = get(`${name}--line-height`);
            const fontWeight = get(`${name}--font-weight`);
            const px = `${parseFloat(value) * 16}px`;
            return (
              <li key={name}>
                <p className="text-caption-s text-text-secondary">
                  {name.replace("--", "")} · {px} · {lineHeight} · {fontWeight}
                </p>
                <p
                  className="text-text-default mt-1"
                  style={{ fontSize: value, lineHeight, fontWeight }}
                >
                  라이브로 발견하고, 펀딩으로 함께 Fundit 0123
                </p>
              </li>
            );
          })}
        </ul>
      </Section>
    );
  },
};

export const Radius: Story = {
  render: () => {
    const radii = readTokens().filter((t) => t.name.startsWith("--radius-"));
    return (
      <Section title="Radius" note="기본 사용 범위는 8~12px다.">
        <ul className="flex flex-wrap gap-4">
          {radii.map(({ name, value }) => (
            <li key={name} className="w-32">
              <div className="bg-layer-surface-primary h-20" style={{ borderRadius: value }} />
              <p className="text-label-m text-text-default mt-2">{name.replace("--radius-", "")}</p>
              <p className="text-caption-s text-text-secondary">{value}</p>
            </li>
          ))}
        </ul>
      </Section>
    );
  },
};

export const Elevation: Story = {
  render: () => {
    const shadows = readTokens().filter((t) => t.name.startsWith("--shadow-"));
    return (
      <Section title="Shadow" note="light와 dark는 테마가 아니라 그림자 농도다.">
        <ul className="flex flex-wrap gap-6">
          {shadows.map(({ name, value }) => (
            <li key={name} className="w-44">
              <div
                className="bg-layer-surface-default h-20 rounded-sm"
                style={{ boxShadow: value }}
              />
              <p className="text-label-m text-text-default mt-3">{name.replace("--shadow-", "")}</p>
            </li>
          ))}
        </ul>
      </Section>
    );
  },
};

export const BorderWidth: Story = {
  render: () => (
    <Section
      title="Border width"
      note="Tailwind에 대응 네임스페이스가 없어 @utility로 정의했다. border-l·border-s가 기본 유틸리티와 충돌해 border-w- 접두어를 쓴다."
    >
      <ul className="flex flex-wrap gap-4">
        {(
          [
            ["border-w-xs", "1px"],
            ["border-w-s", "1.3px"],
            ["border-w-m", "1.5px"],
            ["border-w-l", "1.8px"],
            ["border-w-xl", "2px"],
          ] as const
        ).map(([cls, value]) => (
          <li key={cls} className="w-36">
            <div
              className={`${cls} border-border-primary bg-layer-surface-default h-20 rounded-sm`}
            />
            <p className="text-label-m text-text-default mt-2">{cls}</p>
            <p className="text-caption-s text-text-secondary">{value}</p>
          </li>
        ))}
      </ul>
    </Section>
  ),
};
