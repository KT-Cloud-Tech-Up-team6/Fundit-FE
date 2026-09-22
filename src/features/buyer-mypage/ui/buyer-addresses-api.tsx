"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeDefaultAddress,
  deleteAddress,
  getAddresses,
  registerAddress,
  updateAddress,
} from "@/entities/member/api/member-api";
import type { Address } from "@/entities/member/api/member-api";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { Button } from "@/shared/components/ui/button";
import { TextButton } from "@/shared/components/ui/text-button";
import { ShippingAddressSheet } from "@/features/order-checkout/ui/shipping-address-sheet";
import type { ShippingAddress } from "@/features/order-checkout/model/checkout-demo";
import { MemberAccess } from "./member-access";

export function BuyerAddressesApi() {
  return (
    <MemberAccess>
      {(member) => <Addresses key={member.memberId} memberId={member.memberId} />}
    </MemberAccess>
  );
}
/* 입력 시트는 주문 배송지 형식을 쓰고 서버는 addresses 형식을 쓴다. 두 방향 변환을 한곳에 둔다. */
function toFormValue(address: Address): ShippingAddress {
  return {
    recipientName: address.recipientName,
    phone: address.phoneNumber,
    zipCode: address.zipcode,
    baseAddress: address.addressLine1,
    detailAddress: address.addressLine2 ?? "",
    isDefault: address.isDefault,
  };
}
function toRequestBody(address: ShippingAddress) {
  return {
    recipientName: address.recipientName.trim(),
    phoneNumber: address.phone,
    zipcode: address.zipCode,
    addressLine1: address.baseAddress,
    addressLine2: address.detailAddress,
    isDefault: address.isDefault ?? false,
  };
}
function Addresses({ memberId }: { memberId: string }) {
  const client = useQueryClient();
  const key = ["member-addresses", memberId];
  const list = useQuery({ queryKey: key, queryFn: ({ signal }) => getAddresses(signal) });
  /* sheet가 null이면 닫힌 상태, address가 null이면 신규 등록이다. */
  const [sheet, setSheet] = useState<{ address: Address | null } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [listError, setListError] = useState("");
  /* 목록 전체가 한 자원이라 수정·삭제·기본 지정을 겹쳐 보내면 마지막 응답만 남는다. */
  const running = useRef(false);

  async function run(work: () => Promise<unknown>, failure: string, onError: (m: string) => void) {
    if (running.current) return false;
    running.current = true;
    setBusy(true);
    onError("");
    try {
      await work();
      // 서버가 다른 항목의 기본값까지 바꾸므로 응답 한 건이 아니라 목록을 다시 받는다.
      await client.invalidateQueries({ queryKey: key });
      return true;
    } catch {
      onError(failure);
      return false;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  async function save(value: ShippingAddress) {
    const target = sheet?.address ?? null;
    const done = await run(
      () =>
        target
          ? updateAddress(target.id, toRequestBody(value))
          : registerAddress(toRequestBody(value)),
      target
        ? "배송지를 수정하지 못했습니다. 입력을 확인하고 다시 시도해주세요."
        : "배송지를 등록하지 못했습니다. 입력을 확인하고 다시 시도해주세요.",
      setError,
    );
    if (done) setSheet(null);
  }
  async function remove(addressId: number) {
    const done = await run(
      () => deleteAddress(addressId),
      "배송지를 삭제하지 못했습니다. 다시 시도해주세요.",
      setListError,
    );
    if (done) setConfirmingId(null);
  }
  function openSheet(address: Address | null) {
    setError("");
    setListError("");
    setConfirmingId(null);
    setSheet({ address });
  }
  return (
    <BuyerAccountScreen title="배송지 관리" backHref="/my">
      <div className="space-y-4 p-5">
        {list.isPending ? (
          <p role="status">배송지를 불러오고 있습니다.</p>
        ) : list.isError ? (
          <p role="alert">
            배송지 조회 실패. <button onClick={() => void list.refetch()}>다시 시도</button>
          </p>
        ) : (
          <>
            {!list.data.length && <p>등록된 배송지가 없습니다.</p>}
            {listError && <p role="alert">{listError}</p>}
            {list.data.map((address) => (
              <article
                key={address.id}
                className="border-border-default space-y-2 rounded-xs border p-4"
              >
                <h2 className="text-title-s">
                  {address.recipientName}{" "}
                  {address.isDefault && (
                    <span className="text-text-primary text-body-s">기본 배송지</span>
                  )}
                </h2>
                <p>{address.phoneNumber}</p>
                <p>
                  ({address.zipcode}) {address.addressLine1} {address.addressLine2}
                </p>
                {confirmingId === address.id ? (
                  <div className="flex items-center gap-3">
                    <p className="text-body-s">이 배송지를 삭제할까요?</p>
                    <TextButton
                      showIcon={false}
                      disabled={busy}
                      aria-label={`${address.recipientName} 배송지 삭제 확인`}
                      onClick={() => void remove(address.id)}
                    >
                      삭제
                    </TextButton>
                    <TextButton
                      showIcon={false}
                      disabled={busy}
                      onClick={() => setConfirmingId(null)}
                    >
                      취소
                    </TextButton>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <TextButton
                      showIcon={false}
                      disabled={busy}
                      aria-label={`${address.recipientName} 배송지 수정`}
                      onClick={() => openSheet(address)}
                    >
                      수정
                    </TextButton>
                    {!address.isDefault && (
                      <TextButton
                        showIcon={false}
                        disabled={busy}
                        aria-label={`${address.recipientName} 배송지를 기본으로 지정`}
                        onClick={() =>
                          void run(
                            () => changeDefaultAddress(address.id),
                            "기본 배송지를 변경하지 못했습니다. 다시 시도해주세요.",
                            setListError,
                          )
                        }
                      >
                        기본으로 지정
                      </TextButton>
                    )}
                    <TextButton
                      showIcon={false}
                      disabled={busy}
                      aria-label={`${address.recipientName} 배송지 삭제`}
                      onClick={() => {
                        setListError("");
                        setConfirmingId(address.id);
                      }}
                    >
                      삭제
                    </TextButton>
                  </div>
                )}
              </article>
            ))}
          </>
        )}
        <Button disabled={busy} onClick={() => openSheet(null)}>
          배송지 등록
        </Button>
      </div>
      <ShippingAddressSheet
        open={sheet !== null}
        initial={sheet?.address ? toFormValue(sheet.address) : null}
        onClose={() => {
          if (!busy) setSheet(null);
        }}
        onSave={(address) => void save(address)}
        busy={busy}
        error={error}
        showDeliveryMemo={false}
      />
    </BuyerAccountScreen>
  );
}
