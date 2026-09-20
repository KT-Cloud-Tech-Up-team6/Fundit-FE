"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAddresses, registerAddress } from "@/entities/member/api/member-api";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { Button } from "@/shared/components/ui/button";
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
function Addresses({ memberId }: { memberId: string }) {
  const client = useQueryClient();
  const key = ["member-addresses", memberId];
  const list = useQuery({ queryKey: key, queryFn: ({ signal }) => getAddresses(signal) });
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const saving = useRef(false);
  async function save(address: ShippingAddress) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await registerAddress({
        recipientName: address.recipientName.trim(),
        phoneNumber: address.phone,
        zipcode: address.zipCode,
        addressLine1: address.baseAddress,
        addressLine2: address.detailAddress,
        isDefault: address.isDefault ?? false,
      });
      setOpen(false);
      await client.invalidateQueries({ queryKey: key });
    } catch {
      setError("배송지를 등록하지 못했습니다. 입력을 확인하고 다시 시도해주세요.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
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
              </article>
            ))}
          </>
        )}
        <Button
          onClick={() => {
            setError("");
            setOpen(true);
          }}
        >
          배송지 등록
        </Button>
      </div>
      <ShippingAddressSheet
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        onSave={(address) => void save(address)}
        busy={busy}
        error={error}
        showDeliveryMemo={false}
      />
    </BuyerAccountScreen>
  );
}
