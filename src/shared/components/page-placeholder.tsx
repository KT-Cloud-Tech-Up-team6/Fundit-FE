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
      <section className="border-border-default bg-layer-surface-default shadow-light-s overflow-hidden rounded-md border">
        <div className="border-border-default bg-layer-bg border-b p-6 sm:p-10">
          <p className="text-label-l text-text-default tracking-[0.16em] uppercase">{eyebrow}</p>
          <h1 className="text-display-s sm:text-display-m mt-3 tracking-tight">{title}</h1>
          <p className="text-body-m text-text-secondary mt-4 max-w-3xl">{description}</p>
          <dl className="text-label-m mt-6 flex flex-wrap gap-2">
            <div className="bg-layer-surface-primary text-text-inverse rounded-full px-3 py-2">
              화면 {screenIds}
            </div>
            <div className="border-border-default bg-layer-surface-default rounded-full border px-3 py-2">
              접근 {access}
            </div>
          </dl>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
          {sections.map((section) => (
            <article
              key={section}
              className="border-border-default bg-layer-bg min-h-32 rounded-md border border-dashed p-5"
            >
              <h2 className="text-body-strong">{section}</h2>
              <p className="text-body-s text-text-secondary mt-2">
                기능 개발 단계에서 실제 데이터와 상호작용을 연결합니다.
              </p>
            </article>
          ))}
        </div>
        {children ? (
          <div className="border-border-default border-t p-5 sm:p-8">{children}</div>
        ) : null}
      </section>
    </div>
  );
}
