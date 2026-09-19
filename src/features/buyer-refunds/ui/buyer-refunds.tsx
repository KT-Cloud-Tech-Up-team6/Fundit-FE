"use client";

import { useState } from "react";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { Badge } from "@/shared/components/ui/badge";
import { Dropdown } from "@/shared/components/ui/dropdown";
import { Icon } from "@/shared/components/ui/icon";
import { Radio } from "@/shared/components/ui/radio";
import {
  filterRefundHistory,
  refundBadgeVariant,
  refundHistory,
  refundTypeOptions,
  type RefundFilterType,
} from "../model/refunds-demo";

export function BuyerRefunds({ entries = refundHistory }: { entries?: typeof refundHistory }) {
  const [type, setType] = useState<RefundFilterType>("전체");
  const [inProgressOnly, setInProgressOnly] = useState(false);
  const filtered = filterRefundHistory(entries, type, inProgressOnly);

  return (
    <BuyerAccountScreen title="취소/환불/교환 내역">
      <div className="bg-layer-bg min-h-[calc(100dvh-52px)] w-full pb-[calc(54px+env(safe-area-inset-bottom))]">
        <div className="bg-layer-surface-default flex w-full items-center justify-between gap-1 px-5 py-3">
          <p className="text-caption-m text-text-secondary">총 {filtered.length}개</p>
          <div className="flex items-center gap-1">
            <Radio
              className="[&>span:last-child]:!text-caption-m px-2 py-1"
              checked={inProgressOnly}
              onChange={() => {}}
              onClick={() => setInProgressOnly((value) => !value)}
            >
              진행 중만 보기
            </Radio>
            <Dropdown
              size="xs"
              className="w-[54px] shrink-0"
              aria-label="유형 필터"
              value={type}
              options={refundTypeOptions}
              onValueChange={(value) => setType(value as RefundFilterType)}
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="bg-layer-surface-default text-body-s px-5 py-24 text-center">
            취소/환불/교환 내역이 없습니다.
          </p>
        ) : (
          filtered.map((entry) => (
            <details
              key={entry.id}
              open={entry.type === "취소" && entry.status === "취소 완료"}
              className="group border-border-default bg-layer-surface-default flex w-full flex-col border-b px-5 py-3"
            >
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="text-body-strong flex items-center justify-between">
                  <span>{entry.type}</span>
                  <Icon
                    name="arrowDown"
                    className="text-text-disabled size-[14px] group-open:rotate-180"
                  />
                </div>
                <p className="text-caption-m">{entry.fundingNumber}</p>
                <h2 className="text-caption-m max-w-[259px] truncate font-medium">{entry.title}</h2>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={refundBadgeVariant(entry.status)}>{entry.status}</Badge>
                  {entry.completedAt && (
                    <span className="text-caption-m text-text-secondary">{entry.completedAt}</span>
                  )}
                </div>
              </summary>
              <div className="pt-2">
                <dl className="bg-layer-surface-disabled space-y-3 rounded-sm p-4 text-[0.875rem] leading-[1.25rem]">
                  {[
                    ["신청 일자", entry.requestedAt],
                    ["접수 사유", entry.reason],
                    ["접수 상품", entry.product],
                    ["옵션", entry.option],
                    ["판매가", `${entry.price.toLocaleString("ko-KR")}원`],
                    ["신청 수량", `${entry.quantity}개`],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[94px_1fr] gap-2">
                      <dt className="text-text-secondary">{label}</dt>
                      <dd className="min-w-0 break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
                {entry.cash !== null && (
                  <dl className="mt-3 space-y-2">
                    <div className="flex justify-between gap-3">
                      <dt className="text-caption-m text-text-secondary font-medium">
                        실 환불 금액
                      </dt>
                      <dd className="text-title-s">{entry.cash.toLocaleString("ko-KR")}원</dd>
                    </div>
                    {entry.points !== null && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-caption-m text-text-secondary font-medium">
                          적립금 환불 금액
                        </dt>
                        <dd className="text-title-s">{entry.points.toLocaleString("ko-KR")}원</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            </details>
          ))
        )}
      </div>
      <BuyerBottomNavigation
        activeHref="/my"
        compact
        className="fixed bottom-0 left-1/2 z-20 w-full max-w-[390px] -translate-x-1/2"
      />
    </BuyerAccountScreen>
  );
}
