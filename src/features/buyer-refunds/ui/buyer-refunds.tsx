"use client";

import { Fragment, type ReactNode } from "react";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { Badge } from "@/shared/components/ui/badge";
import { Dropdown } from "@/shared/components/ui/dropdown";
import { Icon } from "@/shared/components/ui/icon";
import { Radio } from "@/shared/components/ui/radio";
import {
  refundBadgeVariant,
  refundTypeOptions,
  type RefundEntry,
  type RefundFilterType,
} from "../model/refund-history";

/* 화면정의(2323:52291)와 마이페이지 메뉴는 "취소/환불/교환 내역"이지만 09-25 화면 헤더(RFND_1~4)를 따른다. */
const screenTitle = "취소/반품/교환 내역";

/** 목록·로딩·오류가 같은 껍데기를 쓰도록 제목·breadcrumb·하단 메뉴를 한곳에 둔다. */
export function RefundsScreen({
  children,
  fullPage = false,
}: {
  children: ReactNode;
  fullPage?: boolean;
}) {
  return (
    <BuyerAccountScreen
      title={screenTitle}
      breadcrumb={["마이페이지", "펀딩내역", screenTitle]}
      fullPage={fullPage}
    >
      {children}
      <BuyerBottomNavigation
        activeHref="/my"
        compact
        className="fixed inset-x-0 bottom-0 z-20 w-full min-[1200px]:hidden"
      />
    </BuyerAccountScreen>
  );
}

/* 값이 비어도 원본(RFND_2 2323:52906)의 행 수는 유지한다. 빈 칸은 계약이 없어 채우지 못한 자리다. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[94px_1fr] gap-2">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="min-w-0 break-words">{value || "\u00A0"}</dd>
    </div>
  );
}

/** 유형·"진행 중만 보기"는 서버가 거르므로 여기서는 값과 변경만 주고받는다. */
export function BuyerRefunds({
  entries,
  total,
  type,
  onTypeChange,
  inProgress,
  onInProgressChange,
  loading = false,
  children,
}: {
  /** 서버가 필터를 적용한 현재 페이지. */
  entries: RefundEntry[];
  /** 서버가 필터를 적용한 전체 건수(totalElements). */
  total: number;
  type: RefundFilterType;
  onTypeChange: (type: RefundFilterType) => void;
  inProgress: boolean;
  onInProgressChange: (checked: boolean) => void;
  /** 필터·페이지를 바꾼 뒤 새 목록을 기다리는 동안 이전 목록을 보여 주고 있다. */
  loading?: boolean;
  /** 페이지 이동처럼 목록 아래에 덧붙일 요소. */
  children?: ReactNode;
}) {
  /* 서버 전체 건수는 이 페이지에 실제로 내역이 있을 때만 쓴다. 범위를 벗어난 page로 들어오면
     content가 비어 있는데 totalElements는 그대로라, "총 45개" 아래에 "내역이 없습니다"가 붙는다. */
  const count = entries.length > 0 ? total : 0;

  return (
    <RefundsScreen>
      {/* 09-25 기록: 전체 배경색을 surface_default로 바꿨다(update_history 1143:23610). */}
      <div className="bg-layer-surface-default min-h-[calc(100dvh-52px)] w-full pb-[calc(var(--buyer-bottom-navigation-height)+env(safe-area-inset-bottom))] min-[1200px]:min-h-0 min-[1200px]:pb-16">
        <div className="bg-layer-surface-default flex w-full items-center justify-between gap-1 px-5 py-3">
          <p className="text-caption-m text-text-secondary">총 {count}개</p>
          <div className="flex items-center gap-1">
            <Radio
              className="[&>span:last-child]:!text-caption-m px-2 py-1"
              checked={inProgress}
              onChange={() => {}}
              onClick={() => onInProgressChange(!inProgress)}
            >
              진행 중만 보기
            </Radio>
            <Dropdown
              size="xs"
              className="w-[54px] shrink-0"
              aria-label="유형 필터"
              value={type}
              options={refundTypeOptions}
              onValueChange={(value) => onTypeChange(value as RefundFilterType)}
            />
          </div>
        </div>
        {/* 이전 목록이 새 필터의 결과로 읽히지 않도록, 페이지 이동 줄이 없는 한 페이지짜리 목록에서도
            필터 바로 아래에 알린다(원본 없음, 노션 FE 자체 판단 17). */}
        {loading && (
          <p role="status" className="text-caption-m text-text-secondary px-5 pb-3">
            목록을 불러오고 있습니다.
          </p>
        )}
        <div aria-busy={loading}>
          {entries.length === 0 ? (
            <p className="bg-layer-surface-default text-body-s px-5 py-24 text-center">
              {`${screenTitle}이 없습니다.`}
            </p>
          ) : (
            /* 09-25 원본은 기본(RFND_1)과 필터 적용(RFND_4) 모두 카드를 접어 둔다. 펼침(RFND_2)은 누른 뒤 상태다. */
            entries.map((entry) => (
              <details
                key={entry.id}
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
                  <h2 className="text-caption-m truncate font-medium">
                    {entry.title || "프로젝트"}
                  </h2>
                  <div className="mt-2 flex items-center gap-1">
                    <Badge variant={refundBadgeVariant(entry)}>{entry.status}</Badge>
                    {/* completedAt은 반려 처리 시각도 담으므로 완료된 건에만 날짜로 세운다. */}
                    {entry.stage === "완료" && entry.completedAt && (
                      <span className="text-caption-m text-text-secondary">
                        {entry.completedAt}
                      </span>
                    )}
                  </div>
                </summary>
                {/* 펼친 영역은 위 8px·아래 16px이다(2323:52905). 카드의 아래 12px에 4px를 더한다. */}
                <div className="pt-2 pb-1">
                  {/* 영수증 fill #F7F7F7(2323:52906)은 layer-bg 값과 같다. */}
                  <dl className="bg-layer-bg space-y-3 rounded-sm p-4 text-[0.875rem] leading-[1.25rem]">
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
                          value={
                            item.price === null ? "" : `${item.price.toLocaleString("ko-KR")}원`
                          }
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
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-caption-m text-text-secondary font-medium">
                          실 환불 금액
                        </dt>
                        <dd className="text-title-s">{entry.cash.toLocaleString("ko-KR")}원</dd>
                      </div>
                      {entry.points !== null && (
                        <div className="flex items-center justify-between gap-3">
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
        {children}
      </div>
    </RefundsScreen>
  );
}
