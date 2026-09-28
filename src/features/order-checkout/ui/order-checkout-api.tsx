"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  getCheckoutAddresses,
  cancelOrder,
  previewOrder,
  type CheckoutAddress,
  type OrderLine,
  type OrderAddress,
  type OrderCreated,
  type OrderRequest,
} from "@/entities/order/api/order-api";
import { getPublicProject } from "@/entities/project/api/buyer-project-api";
import { MemberAccess } from "@/providers/member-access";
import { Button } from "@/shared/components/ui/button";
import { ErrorState } from "@/shared/components/ui/error-state";
import { Modal } from "@/shared/components/ui/modal";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";
import { publicRewardsQuery, toRewards } from "@/features/reward-selection/model/public-reward";
import { ShippingAddressSheet } from "./shipping-address-sheet";
import { ShippingAddressSection } from "./shipping-address-section";
import { SavedAddressSheet } from "./saved-address-sheet";
import { CheckoutTopBar } from "./checkout-top-bar";
import { CheckoutLayout, PaymentSummarySection, ProjectOrderItems } from "./checkout-parts";
import {
  clearOrderAttempt,
  OrderAttemptError,
  OrderRejectedError,
  submitOrderOnce,
} from "../model/order-attempt";
import { isOrderable } from "../model/order-lines";
import { CouponApiSheet } from "./coupon-api-sheet";
import { couponDroppedMessage, couponPreviewError } from "../model/coupon-preview";
import { couponCodes, type CouponSelection } from "../model/coupon-selection";
import { checkoutLineItems } from "../model/checkout-lines";
import { previewSummaryRows } from "../model/payment-summary";
import { emptyShippingAddress, formatWon, type ShippingAddress } from "../model/checkout-demo";

const SHIPPING_ID = "checkout-shipping-address";
const ITEMS_ID = "checkout-order-items";
const SUMMARY_ID = "checkout-payment-summary";

type PendingOrderChange = {
  body: OrderRequest;
  couponCodes: string[];
  apply: () => void;
};

/* 리워드는 프로젝트 상세의 리워드 선택에서만 고른다. 주문서는 상세가 넘긴 `items` 줄(옵션 조합마다 한 줄)을
   그대로 주문하고 고치지 않는다(#373, Figma FL_B_PY_ORD_1 1534:54000에 리워드 변경 없음). */
export function OrderCheckoutApi({ projectId }: { projectId: string }) {
  const lines = parseLines(useSearchParams().get("items"));
  /* 주문할 줄이 없으면 로그인을 거치지 않고 데모 주문서처럼 안내와 상세 복귀 링크만 둔다. */
  if (!lines.length) return <MissingLines projectId={projectId} />;
  return (
    <MemberAccess>
      {(member) => (
        <Checkout
          key={`${member.memberId}:${projectId}`}
          memberId={member.memberId}
          buyer={{ name: member.name, phone: member.phoneNumber }}
          projectId={projectId}
          lines={lines}
        />
      )}
    </MemberAccess>
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
function toOrderAddress(address: CheckoutAddress): OrderAddress {
  return {
    recipientName: address.recipientName,
    phoneNumber: address.phoneNumber,
    zipcode: address.zipcode,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 ?? "",
  };
}
/** 배송지 섹션·입력 시트는 데모 주문서의 화면 모델을 쓴다. */
function toSheetAddress(address: OrderAddress): ShippingAddress {
  return {
    recipientName: address.recipientName,
    phone: address.phoneNumber,
    zipCode: address.zipcode,
    baseAddress: address.addressLine1,
    detailAddress: address.addressLine2,
  };
}
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
}
function Checkout({
  memberId,
  buyer,
  projectId,
  lines,
}: {
  memberId: string;
  buyer: { name: string; phone: string };
  projectId: string;
  lines: OrderLine[];
}) {
  const router = useRouter();
  const rewards = useQuery(publicRewardsQuery(projectId));
  /* 상세와 같은 키로 프로젝트 조회 캐시를 나눠 쓴다. 썸네일·제목에 쓴다. */
  const project = useQuery({
    queryKey: ["public-project", projectId],
    queryFn: ({ signal }) => getPublicProject(projectId, signal),
  });
  const addresses = useQuery({
    queryKey: ["checkout-addresses", memberId],
    queryFn: ({ signal }) => getCheckoutAddresses(signal),
  });
  /* 고르기 전에는 기본 배송지(없으면 첫 저장 배송지)를 쓴다(Figma "배송지 있을 때").
     id가 null이면 저장하지 않고 이 주문에만 입력한 주소다. */
  const [picked, setPicked] = useState<{ id: number | null; address: OrderAddress } | null>(null);
  const saved = addresses.data?.find((item) => item.isDefault) ?? addresses.data?.[0];
  const current = picked ?? (saved ? { id: saved.id, address: toOrderAddress(saved) } : null);
  const address = current?.address ?? null;
  const [addressSheet, setAddressSheet] = useState<"list" | "form" | null>(null);
  const [addressWarning, setAddressWarning] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    /* 서버가 거절을 확정했으면 주문이 없으니 참여 내역 링크를 두지 않는다(#387). */
    [rejected, setRejected] = useState(false);
  /* 쿠폰이 빠진 채 주문이 이미 만들어진 상태(#404). 재클릭은 재주문하지 않고 그 주문으로 이동한다. */
  const [createdOrder, setCreatedOrder] = useState<OrderCreated | null>(null);
  const [pendingOrderChange, setPendingOrderChange] = useState<PendingOrderChange | null>(null);
  const saving = useRef(false);
  const [selectedCoupons, setSelectedCoupons] = useState<CouponSelection[]>([]);
  const selectedCouponCodes = couponCodes(selectedCoupons);
  const [couponOpen, setCouponOpen] = useState(false);
  const valid = isOrderable(lines, rewards.data);
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
  const amount = valid && address && preview.data ? preview.data : null;
  function requireAddress() {
    if (address) return true;
    setAddressWarning(true);
    scrollToSection(SHIPPING_ID);
    return false;
  }
  function reportOrderError(error: unknown, nextCouponCodes: string[]) {
    setError(
      error instanceof OrderAttemptError
        ? error.message
        : "주문을 완료하지 못했습니다. 참여 내역에서 생성 여부를 먼저 확인해주세요.",
    );
    if (error instanceof OrderRejectedError) {
      setRejected(true);
      if (error.code.startsWith("COUPON_") && nextCouponCodes.length > 0) void preview.refetch();
      else void rewards.refetch();
    }
  }
  async function createOrder(
    body: OrderRequest,
    nextCouponCodes: string[],
    expectedAmount: number,
  ) {
    try {
      const order = await submitOrderOnce(sessionStorage, memberId, body);
      const dropped = couponDroppedMessage(
        nextCouponCodes.length > 0,
        expectedAmount,
        order.finalAmount,
      );
      if (dropped) {
        setCreatedOrder(order);
        setError(dropped);
        return;
      }
      router.replace(`/payment/${order.orderId}`);
    } catch (error) {
      reportOrderError(error, nextCouponCodes);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  function requestOrderChange(change: PendingOrderChange) {
    if (!createdOrder) {
      change.apply();
      return;
    }
    setPendingOrderChange(change);
  }
  async function confirmOrderChange() {
    const change = pendingOrderChange;
    const order = createdOrder;
    if (!change || !order || saving.current) return;
    saving.current = true;
    setBusy(true);
    setRejected(false);
    try {
      await cancelOrder(order.orderId);
    } catch {
      /* 취소가 실패하면 이전 주문과 그 주문 시도는 모두 유지한다. */
      setError((previous) =>
        [previous, "이전 주문을 취소하지 못했습니다. 잠시 후 다시 시도해주세요."]
          .filter(Boolean)
          .join(" "),
      );
      setPendingOrderChange(null);
      saving.current = false;
      setBusy(false);
      return;
    }
    clearOrderAttempt(sessionStorage, memberId, projectId);
    change.apply();
    setCreatedOrder(null);
    setPendingOrderChange(null);
    setError("");
    let nextAmount;
    try {
      nextAmount = await previewOrder(change.body);
    } catch {
      setError("새 주문의 결제 금액을 확인하지 못했습니다. 다시 시도해주세요.");
      saving.current = false;
      setBusy(false);
      return;
    }
    if (nextAmount.finalAmount <= 0) {
      setError("결제 금액이 올바르지 않아 주문할 수 없습니다. 리워드와 쿠폰을 다시 확인해주세요.");
      saving.current = false;
      setBusy(false);
      return;
    }
    await createOrder(change.body, change.couponCodes, nextAmount.finalAmount);
  }
  /* Figma 히스토리 1534:54171대로 결제 버튼은 늘 누를 수 있다. 막힌 이유가 있으면 그 영역으로
     스크롤하고, 배송지가 없으면 데모처럼 배송지 경고를 띄운다. */
  async function pay() {
    if (saving.current) return;
    // 쿠폰 이탈 안내를 이미 보여준 상태의 재클릭 — 주문은 이미 만들어져 있으니 다시 만들지 않는다.
    if (createdOrder) {
      router.replace(`/payment/${createdOrder.orderId}`);
      return;
    }
    if (!valid || couponError) return scrollToSection(ITEMS_ID);
    if (!requireAddress()) return;
    if (!preview.isSuccess || preview.isFetching || !amount) return scrollToSection(SUMMARY_ID);
    if (amount.finalAmount <= 0) {
      setError("결제 금액이 올바르지 않아 주문할 수 없습니다. 리워드와 쿠폰을 다시 확인해주세요.");
      return scrollToSection(SUMMARY_ID);
    }
    saving.current = true;
    setBusy(true);
    setError("");
    setRejected(false);
    await createOrder(body, selectedCouponCodes, amount.finalAmount);
  }
  return (
    <>
      <CheckoutLayout
        summary={
          <PaymentSummarySection rows={amount ? previewSummaryRows(amount) : undefined}>
            {!valid ? (
              <p className="text-body-s text-text-secondary">
                주문 상품을 확인한 뒤 결제 금액을 보여 드립니다.
              </p>
            ) : !address ? (
              <p className="text-body-s text-text-secondary">
                배송지를 입력하면 결제 금액을 보여 드립니다.
              </p>
            ) : preview.isError ? (
              <ErrorState
                variant="section"
                description="결제 금액 조회를 실패하였습니다"
                action={{ onClick: () => void preview.refetch() }}
              />
            ) : (
              <p role="status" className="text-body-s">
                결제 금액을 확인하고 있습니다.
              </p>
            )}
          </PaymentSummarySection>
        }
        summaryId={SUMMARY_ID}
        notice={
          <div className="flex flex-col gap-1 text-center">
            {error && (
              <p role="alert" className="text-body-s text-text-warning">
                {error}
                {!rejected && (
                  <>
                    {" "}
                    <Link className="underline" href="/my/fundings">
                      참여 내역 확인
                    </Link>
                  </>
                )}
              </p>
            )}
            {/* 결제 수단은 주문 생성 뒤 Toss 결제위젯에서 고른다(노션 FE 자체 판단 79). */}
            <p className="text-caption-s text-text-secondary">
              결제 수단은 다음 화면에서 선택합니다.
            </p>
          </div>
        }
        ctaLabel={
          busy
            ? "주문 생성 중"
            : createdOrder
              ? `${formatWon(createdOrder.finalAmount)} 결제 계속하기`
              : amount
                ? `${formatWon(amount.finalAmount)} 결제`
                : "결제하기"
        }
        ctaDisabled={busy}
        onPay={() => void pay()}
      >
        {addresses.isPending ? (
          <section aria-label="배송지" className="bg-layer-surface-default px-5 py-4">
            <p role="status">배송지를 불러오고 있습니다.</p>
          </section>
        ) : (
          <>
            {/* 목록을 못 받아도 이 주문에만 쓸 주소는 입력할 수 있게 둔다. */}
            {addresses.isError && (
              <section aria-label="저장된 배송지" className="bg-layer-surface-default px-5 py-4">
                <ErrorState
                  variant="section"
                  description="배송지 조회를 실패하였습니다"
                  action={{ onClick: () => void addresses.refetch() }}
                />
              </section>
            )}
            <ShippingAddressSection
              id={SHIPPING_ID}
              state={address ? "saved" : addressWarning ? "warning" : "empty"}
              address={
                address
                  ? toSheetAddress(address)
                  : { ...emptyShippingAddress(), recipientName: buyer.name, phone: buyer.phone }
              }
              onChangeAddress={() => setAddressSheet(addresses.data?.length ? "list" : "form")}
              onAddAddress={() => setAddressSheet("form")}
            />
          </>
        )}
        <section
          id={ITEMS_ID}
          aria-label="주문 상품"
          className="bg-layer-surface-default flex flex-col gap-3 px-5 py-4"
        >
          {rewards.isError ? (
            <ErrorState
              variant="section"
              description="리워드 조회를 실패하였습니다"
              action={{ onClick: () => void rewards.refetch() }}
            />
          ) : project.isError ? (
            <ErrorState
              variant="section"
              description="프로젝트 조회를 실패하였습니다"
              action={{ onClick: () => void project.refetch() }}
            />
          ) : rewards.isPending || project.isPending ? (
            <p role="status">주문 상품을 불러오고 있습니다.</p>
          ) : (
            <ProjectOrderItems
              title={project.data.title}
              image={project.data.coverImageUrl}
              items={checkoutLineItems(lines, toRewards(rewards.data))}
            />
          )}
          {/* 품절·재고 초과·없는 옵션처럼 주문할 수 없는 줄은 여기서 고칠 수 없어 상세로 돌려보낸다. */}
          {rewards.isSuccess && !valid && (
            <p role="alert" className="text-body-s text-text-warning">
              주문할 수 없는 리워드가 있습니다.{" "}
              <Link className="underline" href={`/projects/${projectId}`}>
                리워드 선택으로 돌아가기
              </Link>
            </p>
          )}
          <div>
            <Button
              type="button"
              variant="secondary"
              appearance="cta"
              size="md"
              className="w-full"
              disabled={busy || !valid}
              onClick={() => {
                if (requireAddress()) setCouponOpen(true);
              }}
            >
              {selectedCouponCodes.length ? "쿠폰 변경" : "쿠폰 적용"}
            </Button>
            {selectedCouponCodes.length > 0 && (
              <p className="text-body-s mt-2">쿠폰 {selectedCouponCodes.length}개 사용중</p>
            )}
            {couponError && (
              <p role="alert" className="text-body-s text-text-warning mt-2">
                {couponError} 쿠폰을 변경하거나 해제해주세요.
              </p>
            )}
          </div>
        </section>
      </CheckoutLayout>
      {couponOpen && address && valid && (
        <CouponApiSheet
          memberId={memberId}
          body={body}
          selected={selectedCoupons}
          onClose={() => setCouponOpen(false)}
          onApply={(selection) => {
            setCouponOpen(false);
            const nextCouponCodes = couponCodes(selection);
            if (
              nextCouponCodes.join(",") === selectedCouponCodes.join(",") &&
              selection.map((item) => item.issuerType).join(",") ===
                selectedCoupons.map((item) => item.issuerType).join(",")
            )
              return;
            requestOrderChange({
              body: { ...body, couponCodes: nextCouponCodes },
              couponCodes: nextCouponCodes,
              apply: () => setSelectedCoupons(selection),
            });
          }}
        />
      )}
      {addresses.data && (
        <SavedAddressSheet
          open={addressSheet === "list"}
          addresses={addresses.data}
          selectedId={current?.id ?? null}
          onSelect={(item) => {
            setAddressSheet(null);
            if (current?.id === item.id) return;
            const nextAddress = toOrderAddress(item);
            requestOrderChange({
              body: { ...body, shippingAddress: nextAddress },
              couponCodes: selectedCouponCodes,
              apply: () => setPicked({ id: item.id, address: nextAddress }),
            });
          }}
          onAdd={() => setAddressSheet("form")}
          onClose={() => setAddressSheet(null)}
        />
      )}
      <ShippingAddressSheet
        showDeliveryMemo={false}
        showDefault={false}
        open={addressSheet === "form"}
        /* 직접 입력한 주소를 고칠 때만 그 값으로 연다. 저장 배송지는 목록에서 고른다. */
        initial={current?.id === null ? toSheetAddress(current.address) : null}
        onClose={() => setAddressSheet(null)}
        onSave={(value) => {
          const nextAddress = {
            recipientName: value.recipientName,
            phoneNumber: value.phone,
            zipcode: value.zipCode,
            addressLine1: value.baseAddress,
            addressLine2: value.detailAddress,
          };
          setAddressSheet(null);
          requestOrderChange({
            body: { ...body, shippingAddress: nextAddress },
            couponCodes: selectedCouponCodes,
            apply: () => setPicked({ id: null, address: nextAddress }),
          });
        }}
      />
      <Modal
        open={pendingOrderChange !== null}
        title="새로 주문할까요?"
        onClose={() => setPendingOrderChange(null)}
        className="w-120"
      >
        <div className="flex flex-col gap-6 pt-4">
          <p className="text-body-m text-text-default text-center">
            쿠폰 없이 만들어진 이전 주문을 취소하고 새로 주문할까요?
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setPendingOrderChange(null)}
              disabled={busy}
            >
              취소
            </Button>
            <Button
              type="button"
              appearance="cta"
              className="flex-1"
              onClick={() => void confirmOrderChange()}
              disabled={busy}
            >
              {busy ? "주문 생성 중" : "확인"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
