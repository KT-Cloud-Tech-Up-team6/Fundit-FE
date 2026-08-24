import type { ReactNode } from "react";
import { BuyerShell } from "@/shared/components/layout/buyer-shell";

export default function BuyerLayout({ children }: { children: ReactNode }) {
  return <BuyerShell>{children}</BuyerShell>;
}
