import type { ReactNode } from "react";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";
import { CheckoutTopBar } from "@/features/order-checkout/ui/checkout-top-bar";

export function PaymentShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-layer-bg min-h-dvh">
      <BuyerDesktopHeader />
      <div className="mx-auto max-w-300">
        <CheckoutTopBar title={title} />
        <div className="mx-auto max-w-[746px] space-y-3 min-[1200px]:py-8">{children}</div>
      </div>
    </div>
  );
}
