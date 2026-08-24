import type { ReactNode } from "react";

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  screenIds: string;
  access: string;
  sections: readonly string[];
  children?: ReactNode;
};

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  screenIds,
  access,
  sections,
  children,
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
        <div className="border-b border-line bg-gradient-to-br from-teal-50 to-amber-50 p-6 sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted">{description}</p>
          <dl className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
            <div className="rounded-full bg-slate-900 px-3 py-2 text-white">화면 {screenIds}</div>
            <div className="rounded-full border border-line bg-surface px-3 py-2">
              접근 {access}
            </div>
          </dl>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
          {sections.map((section) => (
            <article
              key={section}
              className="min-h-32 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5"
            >
              <h2 className="font-bold">{section}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                기능 개발 단계에서 실제 데이터와 상호작용을 연결합니다.
              </p>
            </article>
          ))}
        </div>
        {children ? <div className="border-t border-line p-5 sm:p-8">{children}</div> : null}
      </section>
    </div>
  );
}
