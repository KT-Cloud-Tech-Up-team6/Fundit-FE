"use client";

import { Fragment, useState, type ReactNode } from "react";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { Badge } from "@/shared/components/ui/badge";
import { Dropdown } from "@/shared/components/ui/dropdown";
import { Icon } from "@/shared/components/ui/icon";
import { Radio } from "@/shared/components/ui/radio";
import {
  filterRefundEntries,
  refundBadgeVariant,
  refundTypeOptions,
  type RefundEntry,
  type RefundFilterType,
} from "../model/refund-history";

const screenTitle = "취소/환불/교환 내역";

/** 목록·로딩·오류가 같은 껍데기를 쓰도록 제목·breadcrumb·하단 메뉴를 한곳에 둔다. */
export function RefundsScreen({ children }: { children: ReactNode }) {
  return (
    <BuyerAccountScreen title={screenTitle} breadcrumb={["마이페이지", "펀딩내역", screenTitle]}>
      {children}
      <BuyerBottomNavigation
        activeHref="/my"
        compact
        className="fixed inset-x-0 bottom-0 z-20 w-full min-[1200px]:hidden"
      />
    </BuyerAccountScreen>
  );
}

/* 값이 비어도 원본(891:9152)의 행 수는 유지한다. 빈 칸은 계약이 없어 채우지 못한 자리다. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[94px_1fr] gap-2">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="min-w-0 break-words">{value || "\u00A0"}</dd>
    </div>
  );
}

export function BuyerRefunds({
  entries,
  total,
  children,
}: {
  entries: RefundEntry[];
  /** 서버 전체 건수. 필터를 걸지 않은 동안에만 쓴다. */
  total?: number;
  /** 페이지 이동처럼 목록 아래에 덧붙일 요소. */
  children?: ReactNode;
}) {
  const [type, setType] = useState<RefundFilterType>("전체");
  const [inProgressOnly, setInProgressOnly] = useState(false);
  const filtered = filterRefundEntries(entries, type, inProgressOnly);
  const filtering = type !== "전체" || inProgressOnly;
  /* 서버 전체 건수는 이 페이지에 실제로 내역이 있을 때만 쓴다. 범위를 벗어난 page로 들어오면
     content가 비어 있는데 totalElements는 그대로라, "총 45개" 아래에 "내역이 없습니다"가 붙는다. */
  const count = !filtering && total !== undefined && entries.length > 0 ? total : filtered.length;

  return (
    <RefundsScreen>
      <div className="bg-layer-bg min-[1200px]:bg-layer-surface-default min-h-[calc(100dvh-52px)] w-full pb-[calc(54px+env(safe-area-inset-bottom))] min-[1200px]:min-h-0 min-[1200px]:pb-16">
        <div className="bg-layer-surface-default flex w-full items-center justify-between gap-1 px-5 py-3">
          <p className="text-caption-m text-text-secondary">총 {count}개</p>
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
            {type === "교환"
              ? "교환 내역은 아직 제공되지 않습니다."
              : "취소/환불/교환 내역이 없습니다."}
          </p>
        ) : (
          filtered.map((entry) => (
            <details
              key={entry.id}
              open={entry.type === "취소" && entry.stage === "완료"}
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
                <p className="text-caption-m">{entry.fundingNumber || "\u00A0"}</p>
                <h2 className="text-caption-m truncate font-medium">{entry.title || "프로젝트"}</h2>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={refundBadgeVariant(entry)}>{entry.status}</Badge>
                  {/* completedAt은 반려 처리 시각도 담으므로 완료된 건에만 날짜로 세운다. */}
                  {entry.stage === "완료" && entry.completedAt && (
                    <span className="text-caption-m text-text-secondary">{entry.completedAt}</span>
                  )}
                </div>
              </summary>
              <div className="pt-2">
                <dl className="bg-layer-surface-disabled space-y-3 rounded-sm p-4 text-[0.875rem] leading-[1.25rem]">
                  <DetailRow label="신청 일자" value={entry.requestedAt} />
                  <DetailRow label="접수 사유" value={entry.reason} />
                  {entry.stage === "반려" && (
                    <>
                      <DetailRow label="반려 일자" value={entry.completedAt} />
                      <DetailRow label="반려 사유" value={entry.rejectedReason} />
                    </>
                  )}
                  {entry.items.map((item, index) => (
                    <Fragment key={index}>
                      <DetailRow label="접수 상품" value={item.product} />
                      <DetailRow label="옵션" value={item.option} />
                      <DetailRow
                        label="판매가"
                        value={item.price === null ? "" : `${item.price.toLocaleString("ko-KR")}원`}
                      />
                      <DetailRow
                        label="신청 수량"
                        value={item.quantity === null ? "" : `${item.quantity}개`}
                      />
                    </Fragment>
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
        {children}
      </div>
    </RefundsScreen>
  );
}
