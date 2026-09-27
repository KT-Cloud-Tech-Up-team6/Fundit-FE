"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  getCheckoutAddresses,
  previewOrder,
  type OrderLine,
  type OrderAddress,
} from "@/entities/order/api/order-api";
import { Button } from "@/shared/components/ui/button";
import { ErrorState } from "@/shared/components/ui/error-state";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";
import { publicRewardsQuery } from "@/features/reward-selection/model/public-reward";
import { ShippingAddressSheet } from "./shipping-address-sheet";
import { CheckoutTopBar } from "./checkout-top-bar";
import { OrderMemberAccess } from "./order-member-access";
import { OrderAttemptError, submitOrderOnce } from "../model/order-attempt";
import { CouponApiSheet } from "./coupon-api-sheet";
import { couponPreviewError } from "../model/coupon-preview";
import { couponCodes, type CouponSelection } from "../model/coupon-selection";

/* 리워드는 프로젝트 상세의 리워드 선택에서만 고른다. 주문서는 상세가 넘긴 `items` 줄(옵션 조합마다 한 줄)을
   그대로 주문하고 고치지 않는다(#373, Figma FL_B_PY_ORD_1 1534:54000에 리워드 변경 없음). */
export function OrderCheckoutApi({ projectId }: { projectId: string }) {
  const lines = parseLines(useSearchParams().get("items"));
  /* 주문할 줄이 없으면 로그인을 거치지 않고 데모 주문서처럼 안내와 상세 복귀 링크만 둔다. */
  if (!lines.length) return <MissingLines projectId={projectId} />;
  return (
    <OrderMemberAccess>
      {(memberId) => (
        <Checkout
          key={`${memberId}:${projectId}`}
          memberId={memberId}
          projectId={projectId}
          lines={lines}
        />
      )}
    </OrderMemberAccess>
  );
}
function parseLines(items: string | null): OrderLine[] {
  try {
    const value: unknown = JSON.parse(items ?? "[]");
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
function MissingLines({ projectId }: { projectId: string }) {
  return (
    <div className="bg-layer-bg min-h-dvh">
      <BuyerDesktopHeader />
      <div className="mx-auto max-w-300">
        <CheckoutTopBar title="주문 확인" />
        <div className="bg-layer-surface-default space-y-4 px-5 py-16 text-center">
          <p>리워드를 먼저 선택해주세요.</p>
          <Link className="inline-block underline" href={`/projects/${projectId}`}>
            리워드 선택으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
function Checkout({
  memberId,
  projectId,
  lines,
}: {
  memberId: string;
  projectId: string;
  lines: OrderLine[];
}) {
  const router = useRouter();
  const rewards = useQuery(publicRewardsQuery(projectId));
  const addresses = useQuery({
    queryKey: ["checkout-addresses", memberId],
    queryFn: ({ signal }) => getCheckoutAddresses(signal),
  });
  const [address, setAddress] = useState<OrderAddress | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressOpen, setAddressOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const saving = useRef(false);
  const [selectedCoupons, setSelectedCoupons] = useState<CouponSelection[]>([]);
  const selectedCouponCodes = couponCodes(selectedCoupons);
  const [couponOpen, setCouponOpen] = useState(false);
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
  const body = {
    projectId,
    lineItems: lines,
    shippingAddress: address!,
    couponCodes: selectedCouponCodes,
  };
  const preview = useQuery({
    queryKey: ["order-preview", memberId, body],
    queryFn: () => previewOrder(body),
    enabled: valid && Boolean(address),
  });
  const couponError = preview.data ? couponPreviewError(preview.data, selectedCouponCodes) : "";
  async function submit() {
    if (
      saving.current ||
      !valid ||
      !address ||
      !preview.isSuccess ||
      preview.isFetching ||
      couponError
    )
      return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const order = await submitOrderOnce(sessionStorage, memberId, body);
      router.replace(`/payment/${order.orderId}`);
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
  return (
    <div className="bg-layer-bg min-h-dvh">
      <BuyerDesktopHeader />
      <div className="mx-auto max-w-300">
        <CheckoutTopBar title="주문 확인" />
        <div className="grid gap-3 min-[1200px]:grid-cols-[minmax(0,746px)_386px] min-[1200px]:gap-10 min-[1200px]:py-8">
          <div className="space-y-3">
            <section className="bg-layer-surface-default space-y-3 p-5">
              <h2 className="text-title-s">선택한 리워드</h2>
              {rewards.isPending ? (
                <p role="status">리워드를 불러오고 있습니다.</p>
              ) : rewards.isError ? (
                <ErrorState
                  variant="section"
                  description="리워드 조회를 실패하였습니다"
                  action={{ onClick: () => void rewards.refetch() }}
                />
              ) : (
                <>
                  {/* 리워드 선택 시트는 같은 리워드라도 옵션 조합마다 줄을 따로 넘기므로 옵션까지 적는다. */}
                  {lines.map((line, index) => {
                    const reward = rewards.data.find((item) => item.rewardId === line.rewardId);
                    const options =
                      reward?.options.flatMap((group) =>
                        group.values
                          .filter((value) => line.optionValueIds.includes(value.valueId))
                          .map((value) => value.value),
                      ) ?? [];
                    return (
                      <p key={index}>
                        {[reward?.name, ...options, `${line.quantity}개`].join(" · ")}
                      </p>
                    );
                  })}
                  {/* 품절·재고 초과·없는 옵션처럼 주문할 수 없는 줄은 여기서 고칠 수 없어 상세로 돌려보낸다. */}
                  {!valid && (
                    <p role="alert">
                      주문할 수 없는 리워드가 있습니다.{" "}
                      <Link className="underline" href={`/projects/${projectId}`}>
                        리워드 선택으로 돌아가기
                      </Link>
                    </p>
                  )}
                </>
              )}
            </section>
            <section className="bg-layer-surface-default space-y-3 p-5">
              <h2 className="text-title-s">배송지</h2>
              {addresses.isPending ? (
                <p role="status">배송지를 불러오고 있습니다.</p>
              ) : addresses.isError ? (
                <ErrorState
                  variant="section"
                  description="배송지 조회를 실패하였습니다"
                  action={{ onClick: () => void addresses.refetch() }}
                />
              ) : (
                <select
                  aria-label="저장된 배송지"
                  value={selectedAddressId}
                  disabled={busy}
                  onChange={(event) => {
                    const selected = addresses.data.find(
                      (item) => item.id === Number(event.target.value),
                    );
                    setSelectedAddressId(selected ? String(selected.id) : "");
                    if (!selected) setAddress(null);
                    else
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
            <section className="bg-layer-surface-default space-y-3 p-5">
              <h2 className="text-title-s">쿠폰</h2>
              <p>
                {selectedCouponCodes.length
                  ? `쿠폰 ${selectedCouponCodes.length}개를 적용합니다.`
                  : "사용하지 않음"}
              </p>
              <Button disabled={busy || !valid || !address} onClick={() => setCouponOpen(true)}>
                쿠폰 선택
              </Button>
              {(!valid || !address) && <p>리워드와 배송지를 먼저 선택해주세요.</p>}
              {couponError && <p role="alert">{couponError} 쿠폰을 변경하거나 해제해주세요.</p>}
            </section>
          </div>
          <section className="bg-layer-surface-default space-y-3 p-5">
            <h2 className="text-title-s">주문 금액</h2>
            {!address || !valid ? (
              <p>리워드와 배송지를 선택해주세요.</p>
            ) : preview.isPending ? (
              <p role="status">주문 금액을 확인하고 있습니다.</p>
            ) : preview.isError ? (
              <ErrorState
                variant="section"
                description="주문 금액 조회를 실패하였습니다"
                action={{ onClick: () => void preview.refetch() }}
              />
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
            <p className="text-body-s">주문을 생성하면 바로 결제 화면으로 이동합니다.</p>
            <Button
              disabled={
                busy ||
                !valid ||
                !address ||
                !preview.isSuccess ||
                preview.isFetching ||
                Boolean(couponError)
              }
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
      {couponOpen && address && valid && (
        <CouponApiSheet
          memberId={memberId}
          body={body}
          selected={selectedCoupons}
          onClose={() => setCouponOpen(false)}
          onApply={(selection) => {
            setSelectedCoupons(selection);
            setCouponOpen(false);
          }}
        />
      )}
      <ShippingAddressSheet
        showDeliveryMemo={false}
        showDefault={false}
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        onSave={(value) => {
          setSelectedAddressId("");
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
