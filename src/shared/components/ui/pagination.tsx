import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  /** page 번호만 바꾼 URL을 만든다. */
  buildHref: (page: number) => string;
};

/* ponytail: Figma frequently_fill/left_arrow_fill·right_arrow_fill 에셋이 아직
   public/icons 에 없다. 들어오면 Icon 으로 교체한다. */
function Caret({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 20 20" className="size-3.5 fill-current" aria-hidden>
      <path d={direction === "prev" ? "M12.5 4 5 10l7.5 6V4Z" : "M7.5 4 15 10l-7.5 6V4Z"} />
    </svg>
  );
}

const stepClasses =
  "text-body-s aria-disabled:text-text-disabled flex h-8 items-center gap-3 whitespace-nowrap aria-disabled:pointer-events-none";

export function Pagination({ currentPage, totalPages, buildHref }: PaginationProps) {
  if (totalPages < 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav
      aria-label="페이지 목록"
      className="mt-auto flex items-center justify-center gap-[13px] pt-4"
    >
      <Link
        href={buildHref(currentPage - 1)}
        aria-disabled={isFirst}
        tabIndex={isFirst ? -1 : undefined}
        className={stepClasses}
      >
        <Caret direction="prev" />
        이전
      </Link>
      <ol className="flex items-center gap-1">
        {pages.map((page) => (
          <li key={page}>
            <Link
              href={buildHref(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className="text-body-s text-text-disabled aria-[current=page]:text-text-default flex h-8 w-4 items-center justify-center"
            >
              {page}
            </Link>
          </li>
        ))}
      </ol>
      <Link
        href={buildHref(currentPage + 1)}
        aria-disabled={isLast}
        tabIndex={isLast ? -1 : undefined}
        className={stepClasses}
      >
        다음
        <Caret direction="next" />
      </Link>
    </nav>
  );
}
