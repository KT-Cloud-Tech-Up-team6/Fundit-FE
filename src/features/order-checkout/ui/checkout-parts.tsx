import Image from "next/image";
import type { ReactNode } from "react";
import { Button } from "@/shared/components/ui/button";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";
import { formatWon } from "../model/checkout-demo";
import type { CheckoutLineItem } from "../model/checkout-lines";
import type { SummaryLine, SummaryRows } from "../model/payment-summary";
import { CheckoutTopBar } from "./checkout-top-bar";

/* 데모 주문서(OrderCheckoutScreen)와 실제 주문서(OrderCheckoutApi)가 함께 쓰는 Figma 주문서
   (FL_B_PY_ORD_1 1534:54000) 조각. 상태와 데이터는 각 화면이 들고 여기서는 그리기만 한다. */

type CheckoutLayoutProps = {
  /** 본문 섹션. 모바일은 위에서 아래로, 1200px 이상은 왼쪽 열에 둔다. */
  children: ReactNode;
  /** 결제 금액. 모바일은 본문 끝, 1200px 이상은 오른쪽 sticky 상자에 둔다. */
  summary: ReactNode;
  /** 모바일 결제 금액 자리의 id. 결제 시도 시 금액 영역으로 스크롤할 때 쓴다. */
  summaryId?: string;
  /** CTA 위 안내. */
  notice?: ReactNode;
  ctaLabel: string;
  ctaDisabled?: boolean;
  onPay: () => void;
};

export function CheckoutLayout({
  children,
  summary,
  summaryId,
  notice,
  ctaLabel,
  ctaDisabled = false,
  onPay,
}: CheckoutLayoutProps) {
  return (
    /* 모바일은 #165대로 가용 폭을 쓰고, 데스크톱은 라이브·상세와 같은 헤더와 1200px 그리드를 쓴다. */
    <div className="bg-layer-bg min-[1200px]:bg-layer-surface-default min-h-dvh w-full">
      <BuyerDesktopHeader />
      <div className="mx-auto flex min-h-dvh w-full flex-col min-[1200px]:min-h-[calc(100dvh-70px)] min-[1200px]:max-w-300">
        <div className="min-[1200px]:hidden">
          <CheckoutTopBar title="결제" />
        </div>
        <div className="flex flex-1 flex-col gap-3 pb-8 min-[1200px]:grid min-[1200px]:grid-cols-[minmax(0,746px)_386px] min-[1200px]:items-start min-[1200px]:gap-10 min-[1200px]:pt-8 min-[1200px]:pb-16">
          <div className="flex min-w-0 flex-col gap-3">
            {children}
            <div id={summaryId} className="min-[1200px]:hidden">
              {summary}
            </div>
          </div>
          <aside className="hidden min-[1200px]:sticky min-[1200px]:top-6 min-[1200px]:block">
            <div className="border-border-default bg-layer-surface-default overflow-hidden rounded-xs border">
              {summary}
              <div className="border-border-default border-t px-5 py-5">
                {notice && <div className="mb-3">{notice}</div>}
                <Button
                  className="w-full"
                  appearance="cta"
                  size="xl"
                  disabled={ctaDisabled}
                  onClick={onPay}
                >
                  {ctaLabel}
                </Button>
              </div>
            </div>
          </aside>
        </div>
        <div className="bg-layer-surface-default sticky bottom-0 px-5 py-2 pb-[calc(8px+env(safe-area-inset-bottom))] min-[1200px]:hidden">
          {notice && <div className="mb-2">{notice}</div>}
          <Button className="w-full" appearance="cta" disabled={ctaDisabled} onClick={onPay}>
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** 결제 금액. `rows`가 없으면(금액 확인 전) 제목 아래에 `children` 안내를 둔다. */
export function PaymentSummarySection({
  rows,
  children,
}: {
  rows?: SummaryRows;
  children?: ReactNode;
}) {
  return (
    /* 모바일·데스크탑 두 벌이 항상 DOM에 있어 id가 중복되므로 aria-label로 이름을 준다. */
    <section aria-label="결제 금액" className="flex flex-col">
      <div className="bg-layer-surface-default flex flex-col gap-3 px-5 py-4">
        <h2 className="text-title-s text-text-default">결제 금액</h2>
        {rows ? (
          <div className="flex flex-col gap-3">
            <SummaryGroup lines={rows.order} />
            <SummaryGroup lines={rows.discount} discount />
          </div>
        ) : (
          children
        )}
      </div>
      {rows && (
        <div className="bg-layer-surface-default flex items-center justify-between px-5 py-2">
          <span className="text-title-s text-text-default">최종 결제 금액</span>
          <span className="text-title-s text-text-default">{formatWon(rows.finalAmount)}</span>
        </div>
      )}
    </section>
  );
}

function SummaryGroup({ lines, discount = false }: { lines: SummaryLine[]; discount?: boolean }) {
  return (
    <dl className="flex flex-col gap-1.5">
      {lines.map((line, index) => {
        /* 첫 줄은 합계(강조), 나머지는 "ㄴ" 세부 줄(보조색)이다. */
        const tone = index > 0 ? "text-text-secondary" : "text-text-default";
        const size = index === 0 ? "text-body-m font-medium" : "text-body-m";
        return (
          <div key={line.label} className="flex items-center justify-between">
            <dt className={`${size} ${tone}`}>{line.label}</dt>
            <dd className={`${size} ${tone}`}>
              {`${discount ? "-" : ""}${formatWon(line.amount)}`}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Figma `price_information`. 할인하면 정가 취소선과 "얼리버드 할인", 아니면 "상품 금액"을 붙인다. */
export function PriceInformation({
  price,
  originalPrice,
  className = "",
}: {
  price: number;
  originalPrice?: number;
  className?: string;
}) {
  const discounted = originalPrice !== undefined && originalPrice > price;
  return (
    <div className={`flex flex-col items-end ${className}`}>
      {discounted && (
        <span className="text-body-s text-text-secondary line-through">
          {formatWon(originalPrice)}
        </span>
      )}
      <span className="flex items-center gap-2">
        <span className="text-body-s text-text-default">
          {discounted ? "얼리버드 할인" : "상품 금액"}
        </span>
        <span className="text-title-s text-text-default">{formatWon(price)}</span>
      </span>
    </div>
  );
}

/** 실제 주문서의 주문 상품. 프로젝트 썸네일·제목은 한 번, 그 아래에 옵션 줄마다 리워드·수량·
    예상 발송일·금액을 둔다(노션 FE 자체 판단 81). */
export function ProjectOrderItems({
  title,
  image,
  items,
}: {
  title: string;
  image: string | null;
  items: CheckoutLineItem[];
}) {
  return (
    <div className="flex gap-[9px]">
      {image ? (
        /* 서버 썸네일 주소의 호스트가 정해져 있지 않아 최적화를 끈다(프로젝트 상세와 같다). */
        <Image
          src={image}
          alt=""
          width={76}
          height={76}
          unoptimized
          className="size-19 shrink-0 rounded-xs object-cover"
        />
      ) : (
        <span aria-hidden className="bg-layer-surface-disabled size-19 shrink-0 rounded-xs" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-body-strong text-text-default line-clamp-2 pr-3">{title}</p>
        <ul aria-label="주문 리워드" className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li key={index} className="flex flex-col gap-1.5">
              <div className="text-body-s flex flex-col gap-1">
                <span className="text-text-default">{item.label}</span>
                {item.expectedShipping && (
                  <span className="text-text-secondary">{item.expectedShipping}</span>
                )}
              </div>
              {item.price !== undefined && <PriceInformation className="py-2" price={item.price} />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
