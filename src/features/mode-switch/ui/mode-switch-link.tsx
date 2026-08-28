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
      className="border-line bg-surface text-brand-strong hover:border-brand rounded-full border px-3 py-2 text-sm font-semibold transition"
    >
      {label}
    </Link>
  );
}
