"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  getCheckoutRewards,
  getCheckoutAddresses,
  previewOrder,
  type OrderLine,
  type OrderAddress,
} from "@/entities/order/api/order-api";
import { Button } from "@/shared/components/ui/button";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";
import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { QuantityStepper } from "@/features/reward-selection/ui/quantity-stepper";
import { ShippingAddressSheet } from "./shipping-address-sheet";
import { CheckoutTopBar } from "./checkout-top-bar";
import { OrderMemberAccess } from "./order-member-access";
import { OrderAttemptError, submitOrderOnce } from "../model/order-attempt";

export function OrderCheckoutApi({
  projectId,
  selectionOnly = false,
  onClose,
}: {
  projectId: string;
  selectionOnly?: boolean;
  onClose?: () => void;
}) {
  return (
    <OrderMemberAccess>
      {(memberId) => (
        <Checkout
          key={`${memberId}:${projectId}`}
          memberId={memberId}
          projectId={projectId}
          selectionOnly={selectionOnly}
          onClose={onClose}
        />
      )}
    </OrderMemberAccess>
  );
}
function Checkout({
  memberId,
  projectId,
  selectionOnly,
  onClose,
}: {
  memberId: string;
  projectId: string;
  selectionOnly: boolean;
  onClose?: () => void;
}) {
  const router = useRouter(),
    params = useSearchParams();
  function initialLines(): OrderLine[] {
    if (selectionOnly) return [];
    try {
      const value: unknown = JSON.parse(params.get("items") ?? "[]");
      return Array.isArray(value) &&
        value.every(
          (item) =>
            item &&
            Number.isSafeInteger(item.rewardId) &&
            item.rewardId > 0 &&
            Number.isSafeInteger(item.quantity) &&
            item.quantity > 0 &&
            Array.isArray(item.optionValueIds) &&
            item.optionValueIds.every((id: unknown) => Number.isSafeInteger(id)),
        )
        ? value
        : [];
    } catch {
      return [];
    }
  }
  const rewards = useQuery({
    queryKey: ["checkout-rewards", projectId],
    queryFn: ({ signal }) => getCheckoutRewards(projectId, signal),
  });
  const addresses = useQuery({
    queryKey: ["checkout-addresses", memberId],
    queryFn: ({ signal }) => getCheckoutAddresses(signal),
    enabled: !selectionOnly,
  });
  const [lines, setLines] = useState<OrderLine[]>(initialLines),
    [address, setAddress] = useState<OrderAddress | null>(null);
  const [addressOpen, setAddressOpen] = useState(false),
    [rewardsOpen, setRewardsOpen] = useState(() => initialLines().length === 0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const saving = useRef(false);
  const valid =
    lines.length > 0 &&
    lines.every((line) => {
      const reward = rewards.data?.find((item) => item.rewardId === line.rewardId);
      return (
        reward &&
        !reward.soldOut &&
        Number.isSafeInteger(line.quantity) &&
        line.quantity > 0 &&
        (reward.remainingStock == null || line.quantity <= reward.remainingStock) &&
        line.optionValueIds.every((id) =>
          reward.options.some((group) => group.values.some((value) => value.valueId === id)),
        ) &&
        line.optionValueIds.length === reward.options.length &&
        reward.options.every((group) =>
          line.optionValueIds.some((id) => group.values.some((value) => value.valueId === id)),
        )
      );
    });
  const body = { projectId, lineItems: lines, shippingAddress: address!, couponCodes: [] };
  const preview = useQuery({
    queryKey: ["order-preview", memberId, body],
    queryFn: () => previewOrder(body),
    enabled: valid && Boolean(address),
  });
  function updateLine(rewardId: number, change: Partial<OrderLine>) {
    setLines((previous) =>
      previous.map((line) => (line.rewardId === rewardId ? { ...line, ...change } : line)),
    );
  }
  async function submit() {
    if (saving.current || !valid || !address || !preview.isSuccess || preview.isFetching) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const order = await submitOrderOnce(sessionStorage, memberId, body);
      router.replace(`/my/fundings/${order.orderId}`);
    } catch (error) {
      setError(
        error instanceof OrderAttemptError
          ? error.message
          : "주문을 완료하지 못했습니다. 참여 내역에서 생성 여부를 먼저 확인해주세요.",
      );
      saving.current = false;
      setBusy(false);
    }
  }
  const rewardContent = (
    <div className="space-y-4 p-5">
      {rewards.isPending ? (
        <p role="status">리워드를 불러오고 있습니다.</p>
      ) : rewards.isError ? (
        <p role="alert">
          리워드 조회 실패. <button onClick={() => void rewards.refetch()}>다시 시도</button>
        </p>
      ) : (
        rewards.data.map((reward) => {
          const line = lines.find((item) => item.rewardId === reward.rewardId);
          return (
            <article
              key={reward.rewardId}
              className="border-border-default space-y-3 rounded-xs border p-4"
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(line)}
                  disabled={busy || reward.soldOut}
                  onChange={(event) =>
                    setLines((previous) =>
                      event.target.checked
                        ? [
                            { rewardId: reward.rewardId, quantity: 1, optionValueIds: [] },
                            ...previous,
                          ]
                        : previous.filter((item) => item.rewardId !== reward.rewardId),
                    )
                  }
                />
                <span className="text-title-s">{reward.name}</span>
              </label>
              <p>{reward.description}</p>
              <p>
                {(reward.isEarlyBird
                  ? (reward.earlyBirdDiscountedPrice ?? reward.price)
                  : reward.price
                ).toLocaleString("ko-KR")}
                원 {reward.soldOut && "품절"}
              </p>
              {line && (
                <>
                  {reward.options.map((group) => (
                    <label key={group.groupId} className="block">
                      {group.groupName}
                      <select
                        aria-label={`${reward.name} ${group.groupName}`}
                        value={
                          line.optionValueIds.find((id) =>
                            group.values.some((value) => value.valueId === id),
                          ) ?? ""
                        }
                        onChange={(event) =>
                          updateLine(reward.rewardId, {
                            optionValueIds: [
                              ...line.optionValueIds.filter(
                                (id) => !group.values.some((value) => value.valueId === id),
                              ),
                              Number(event.target.value),
                            ],
                          })
                        }
                        className="border-border-default ml-2 rounded-xs border p-2"
                      >
                        <option value="" disabled>
                          선택해주세요
                        </option>
                        {group.values.map((value) => (
                          <option key={value.valueId} value={value.valueId}>
                            {value.value}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <QuantityStepper
                    label={reward.name}
                    value={line.quantity}
                    max={reward.remainingStock ?? undefined}
                    onChange={(quantity) => updateLine(reward.rewardId, { quantity })}
                  />
                </>
              )}
            </article>
          );
        })
      )}
      {rewards.isSuccess && !rewards.data.length && <p>선택할 리워드가 없습니다.</p>}
    </div>
  );
  if (selectionOnly)
    return (
      <BottomSheet
        open
        onClose={() => onClose?.()}
        title="리워드 선택"
        desktopModal
        footer={
          <Button
            disabled={!valid}
            className="w-full"
            onClick={() => {
              router.push(
                `/funding/${projectId}/checkout?${new URLSearchParams({ items: JSON.stringify(lines) })}`,
              );
              onClose?.();
            }}
          >
            펀딩하기
          </Button>
        }
      >
        {rewardContent}
      </BottomSheet>
    );
  return (
    <div className="bg-layer-bg min-h-dvh">
      <BuyerDesktopHeader />
      <div className="mx-auto max-w-300">
        <CheckoutTopBar title="주문 확인" />
        <div className="grid gap-3 min-[1200px]:grid-cols-[minmax(0,746px)_386px] min-[1200px]:gap-10 min-[1200px]:py-8">
          <div className="space-y-3">
            <section className="bg-layer-surface-default p-5">
              <h2 className="text-title-s">선택한 리워드</h2>
              {lines.map((line) => (
                <p key={line.rewardId}>
                  {rewards.data?.find((reward) => reward.rewardId === line.rewardId)?.name} ·{" "}
                  {line.quantity}개
                </p>
              ))}
              <Button disabled={busy} onClick={() => setRewardsOpen(true)}>
                리워드 변경
              </Button>
            </section>
            <section className="bg-layer-surface-default space-y-3 p-5">
              <h2 className="text-title-s">배송지</h2>
              {addresses.isPending ? (
                <p role="status">배송지를 불러오고 있습니다.</p>
              ) : addresses.isError ? (
                <p role="alert">
                  배송지 조회 실패.{" "}
                  <button onClick={() => void addresses.refetch()}>다시 시도</button>
                </p>
              ) : (
                <select
                  aria-label="저장된 배송지"
                  value=""
                  disabled={busy}
                  onChange={(event) => {
                    const selected = addresses.data.find(
                      (item) => item.id === Number(event.target.value),
                    );
                    if (selected)
                      setAddress({
                        recipientName: selected.recipientName,
                        phoneNumber: selected.phoneNumber,
                        zipcode: selected.zipcode,
                        addressLine1: selected.addressLine1,
                        addressLine2: selected.addressLine2 ?? "",
                      });
                  }}
                >
                  <option value="">저장된 배송지 선택</option>
                  {addresses.data.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.recipientName} · {item.addressLine1}
                    </option>
                  ))}
                </select>
              )}
              {address && (
                <>
                  <p>
                    {address.recipientName} · {address.phoneNumber}
                  </p>
                  <p>
                    {address.addressLine1} {address.addressLine2}
                  </p>
                </>
              )}
              <Button disabled={busy} onClick={() => setAddressOpen(true)}>
                배송지 입력
              </Button>
            </section>
          </div>
          <section className="bg-layer-surface-default space-y-3 p-5">
            <h2 className="text-title-s">주문 금액</h2>
            {!address || !valid ? (
              <p>리워드와 배송지를 선택해주세요.</p>
            ) : preview.isPending ? (
              <p role="status">주문 금액을 확인하고 있습니다.</p>
            ) : preview.isError ? (
              <p role="alert">
                주문 금액 조회 실패.{" "}
                <button onClick={() => void preview.refetch()}>다시 시도</button>
              </p>
            ) : (
              <dl className="space-y-2">
                {[
                  ["리워드 금액", preview.data.rewardAmount],
                  ["배송비", preview.data.shippingFee],
                  ["할인 금액", preview.data.discountAmount],
                  ["최종 금액", preview.data.finalAmount],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <dt>{label}</dt>
                    <dd>{Number(value).toLocaleString("ko-KR")}원</dd>
                  </div>
                ))}
              </dl>
            )}
            {error && <p role="alert">{error}</p>}
            <p className="text-body-s">
              주문을 생성한 뒤 참여 내역에서 결제 준비 상태를 확인합니다.
            </p>
            <Button
              disabled={busy || !valid || !address || !preview.isSuccess || preview.isFetching}
              onClick={() => void submit()}
              className="w-full"
            >
              {busy ? "주문 생성 중" : "주문 생성"}
            </Button>
            <Link className="block underline" href="/my/fundings">
              참여 내역 확인
            </Link>
          </section>
        </div>
      </div>
      <BottomSheet
        open={rewardsOpen}
        onClose={() => setRewardsOpen(false)}
        title="리워드 선택"
        desktopModal
        footer={
          <Button disabled={!valid} onClick={() => setRewardsOpen(false)} className="w-full">
            선택 완료
          </Button>
        }
      >
        {rewardContent}
      </BottomSheet>
      <ShippingAddressSheet
        showDeliveryMemo={false}
        showDefault={false}
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        onSave={(value) => {
          setAddress({
            recipientName: value.recipientName,
            phoneNumber: value.phone,
            zipcode: value.zipCode,
            addressLine1: value.baseAddress,
            addressLine2: value.detailAddress,
          });
          setAddressOpen(false);
        }}
      />
    </div>
  );
}
