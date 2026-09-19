"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrderSession } from "@/entities/order/model/order-session";
import { checkoutItems, checkoutSummary } from "../model/checkout-selection";
import type { CheckoutReward } from "../model/checkout-selection";
import { OrderCheckoutScreen } from "./order-checkout-screen";
import { OrderCompleteScreen } from "./order-complete-screen";
import { CheckoutTopBar } from "./checkout-top-bar";

export function CheckoutRoute({
  projectId,
  project,
  rewards,
}: {
  projectId: string;
  project: { title: string; image: string };
  rewards: CheckoutReward[];
}) {
  const session = useOrderSession();
  const router = useRouter();
  const selection = session?.selection;
  if (!session || selection?.projectId !== projectId)
    return <MissingSelection href={`/projects/${projectId}`} />;
  const items = checkoutItems(rewards, selection.cart, project);
  if (!items.length) return <MissingSelection href={`/projects/${projectId}`} />;
  return (
    <OrderCheckoutScreen
      items={items}
      summary={checkoutSummary(items)}
      hasSavedAddress={false}
      initialForm={session.form}
      onFormChange={session.setForm}
      onComplete={(form, paidAmount) => {
        if (!form.address) return;
        session.setReceipt({
          orderId: `DEMO-${Date.now()}`,
          projectId,
          itemSummary: items
            .map(
              (item) =>
                `${item.rewardName}${item.option ? ` (${item.option})` : ""} X ${item.quantity}`,
            )
            .join(", "),
          paidAmount,
          shippingAddress: [form.address.baseAddress, form.address.detailAddress].join(" "),
          ordererName: form.address.recipientName,
          ordererPhone: form.address.phone,
          completeMessage: "리워드 참여가 확정됐습니다",
          expectedShippingDate: "2026.10.12",
        });
        router.replace("/payment/result");
      }}
    />
  );
}

export function PaymentResultRoute() {
  const session = useOrderSession();
  return session?.receipt ? (
    <OrderCompleteScreen receipt={session.receipt} />
  ) : (
    <MissingSelection href="/my/fundings" result />
  );
}

function MissingSelection({ href, result = false }: { href: string; result?: boolean }) {
  return (
    <main className="bg-layer-surface-default mx-auto min-h-dvh w-full min-[1200px]:max-w-[390px]">
      <CheckoutTopBar />
      <div className="space-y-4 px-5 py-16 text-center">
        <p>{result ? "확인할 데모 주문이 없습니다." : "리워드를 먼저 선택해주세요."}</p>
        <p className="text-body-s text-text-secondary">
          새로고침하면 데모 주문 정보가 초기화됩니다.
        </p>
        <Link className="inline-block underline" href={href}>
          {result ? "펀딩내역 보기" : "리워드 선택으로 돌아가기"}
        </Link>
      </div>
    </main>
  );
}
