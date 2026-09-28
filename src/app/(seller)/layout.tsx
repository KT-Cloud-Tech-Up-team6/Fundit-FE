import type { ReactNode } from "react";
import { SellerShell } from "@/shared/components/layout/seller-shell";
import { sellerViewport } from "@/shared/config/seller-viewport";

export const viewport = sellerViewport;

export default function SellerLayout({ children }: { children: ReactNode }) {
  return <SellerShell>{children}</SellerShell>;
}
