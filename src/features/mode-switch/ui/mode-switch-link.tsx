import Link from "next/link";

type ModeSwitchLinkProps = {
  mode: "buyer" | "seller";
};

export function ModeSwitchLink({ mode }: ModeSwitchLinkProps) {
  const target = mode === "buyer" ? "/seller/projects" : "/";
  const label = mode === "buyer" ? "판매자 모드" : "구매자 모드";

  return (
    <Link
      href={target}
      className="rounded-full border border-line bg-surface px-3 py-2 text-sm font-semibold text-brand-strong transition hover:border-brand"
    >
      {label}
    </Link>
  );
}
