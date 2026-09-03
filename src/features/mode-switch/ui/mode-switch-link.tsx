import Link from "next/link";
import { Icon } from "@/shared/components/ui/icon";

type ModeSwitchLinkProps = {
  mode: "buyer" | "seller";
};

export function ModeSwitchLink({ mode }: ModeSwitchLinkProps) {
  const target = mode === "buyer" ? "/seller/projects" : "/";
  const label = mode === "buyer" ? "판매자 모드" : "창작자 센터";

  return (
    <Link
      href={target}
      className="border-w-xs border-border-primary bg-layer-surface-default text-body-s text-text-default hover:bg-layer-surface-disabled flex h-9 w-9 items-center justify-center gap-2 rounded-xs whitespace-nowrap transition md:w-[102px]"
    >
      <span className="sr-only md:not-sr-only">{label}</span>
      <Icon name="swap" className="size-3.5 shrink-0" />
    </Link>
  );
}
