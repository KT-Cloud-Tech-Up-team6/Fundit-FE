import Link from "next/link";
import { Icon } from "@/shared/components/ui/icon";

type ModeSwitchLinkProps = {
  mode: "buyer" | "seller";
};

export function ModeSwitchLink({ mode }: ModeSwitchLinkProps) {
  const target = mode === "buyer" ? "/seller/projects" : "/";
  const label = mode === "buyer" ? "창작자 전환" : "참여자 전환";

  return (
    <Link
      href={target}
      className="bg-layer-surface-disabled text-body-s text-text-default flex h-10 w-10 items-center justify-center gap-2 rounded-xs whitespace-nowrap md:w-[113px] md:px-3"
    >
      <span className="sr-only md:not-sr-only md:whitespace-nowrap">{label}</span>
      <Icon name="swap" className="size-4 shrink-0" />
    </Link>
  );
}
