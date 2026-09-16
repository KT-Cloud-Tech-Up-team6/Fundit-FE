import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type PaginationProps = ComponentPropsWithoutRef<"nav"> & {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  variant?: "pages" | "counter";
  className?: string;
};

function Caret({ direction }: { direction: "prev" | "next" }) {
  return (
    <span aria-hidden className="relative size-3.5 shrink-0">
      <span
        className="absolute inset-x-[28.57%] inset-y-[7.14%] bg-current [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]"
        style={{ maskImage: `url('/icons/molecules/page-${direction}.svg')` }}
      />
    </span>
  );
}

const stepClasses =
  "text-body-s text-text-default aria-disabled:text-text-disabled focus-visible:outline-border-primary flex h-8 items-center gap-3 leading-[1.42] whitespace-nowrap focus-visible:outline-2";

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  variant = "pages",
  className,
  ...props
}: PaginationProps) {
  if (totalPages < 1) return null;
  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const previous = (
    <>
      <Caret direction="prev" />
      이전
    </>
  );
  const next = (
    <>
      다음
      <Caret direction="next" />
    </>
  );
  return (
    <nav
      aria-label="페이지 목록"
      {...props}
      className={["mt-auto flex items-center justify-center gap-4 pt-4", className]
        .filter(Boolean)
        .join(" ")}
    >
      {page === 1 ? (
        <span aria-disabled="true" className={stepClasses}>
          {previous}
        </span>
      ) : (
        <Link href={buildHref(page - 1)} className={stepClasses}>
          {previous}
        </Link>
      )}
      {variant === "counter" ? (
        <span
          className="text-text-default px-1 text-[12px] leading-normal"
          aria-label={`${totalPages}페이지 중 ${page}페이지`}
        >
          {page}/{totalPages}
        </span>
      ) : (
        <ol className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
            <li key={number}>
              <Link
                href={buildHref(number)}
                aria-label={`${number}페이지`}
                aria-current={number === page ? "page" : undefined}
                className="text-body-s text-text-disabled aria-[current=page]:text-text-default focus-visible:outline-border-primary flex h-8 w-4 items-center justify-center leading-[1.42] focus-visible:outline-2"
              >
                {number}
              </Link>
            </li>
          ))}
        </ol>
      )}
      {page === totalPages ? (
        <span aria-disabled="true" className={stepClasses}>
          {next}
        </span>
      ) : (
        <Link href={buildHref(page + 1)} className={stepClasses}>
          {next}
        </Link>
      )}
    </nav>
  );
}
