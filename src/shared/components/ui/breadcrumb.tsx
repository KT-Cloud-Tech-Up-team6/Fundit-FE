type BreadcrumbProps = {
  /** 이동 경로 단계. 링크가 아니라 현재 위치를 나타내는 텍스트다 (Figma header_web breadcrumb). */
  items: readonly string[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="이동 경로" className="text-label-m text-text-secondary">
      <ol className="flex items-center gap-2">
        {items.map((crumb, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={crumb} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden>{">"}</span>}
              <span
                aria-current={isCurrent ? "page" : undefined}
                className={isCurrent ? "text-text-default" : undefined}
              >
                {crumb}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
