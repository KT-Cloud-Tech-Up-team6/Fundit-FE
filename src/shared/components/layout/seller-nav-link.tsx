"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/shared/components/ui/icon";

type SellerNavLinkProps = {
  href: string;
  label: string;
  icon: IconName;
};

export function SellerNavLink({ href, label, icon }: SellerNavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`text-body-emphasis flex h-10 w-[126px] items-center justify-center gap-2 rounded-xs whitespace-nowrap ${
        active ? "text-text-default" : "text-text-secondary"
      }`}
    >
      <Icon name={icon} className="size-4 shrink-0" />
      {label}
    </Link>
  );
}
