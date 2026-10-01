import { Fragment, type ReactNode } from "react";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { formatWon, toFundingDetailView, type FundingDetailView } from "../model/funding-history";
import { demoOrderDetail } from "../model/funding-orders-demo";
import { FundingActionButtons, FundingThumbnail } from "./funding-card-parts";

/** 상세·로딩·오류가 같은 껍데기를 쓰도록 제목·breadcrumb·하단 메뉴를 한곳에 둔다. */
export function FundingDetailScreen({
  children,
  fullPage = false,
}: {
  children: ReactNode;
  fullPage?: boolean;
}) {
  return (
    <BuyerAccountScreen
      title="펀딩 상세 내역"
      backHref="/my/fundings"
      backLabel="펀딩 내역으로 돌아가기"
      breadcrumb={["마이페이지", "펀딩내역", "펀딩 상세 내역"]}
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

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-[9px]">
      <dt className="text-body-s text-text-secondary w-[78px] shrink-0">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{children}</dd>
    </div>
  );
}

/** 펀딩 상세 내역(FL_B_MY_FUND_MNG 2323:53132). 결제 대기 주문의 결제 안내처럼 원본에 없는
    요소는 children으로 받아 펀딩 정보 아래에 둔다. */
export function FundingDetail({
  detail,
  children,
}: {
  detail: FundingDetailView;
  children?: ReactNode;
}) {
  return (
    <FundingDetailScreen>
      <div className="bg-layer-surface-default min-h-[calc(100dvh-52px)] w-full pb-[calc(var(--buyer-bottom-navigation-height)+env(safe-area-inset-bottom))] min-[1200px]:min-h-0 min-[1200px]:pb-16">
        {/* 원본 첫 줄의 주문번호(FD…)와 창작자는 상세 응답에 없어 두지 않는다(노션 FE 자체 판단 39).
            같은 판단에 있던 참여일은 BE #181의 createdAt으로 채웠다(#431). */}
        <section className="flex flex-col gap-4 px-4 py-3">
          <div className="flex gap-3">
            <FundingThumbnail src={detail.imageSrc} className="size-16 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 className="text-label-l">{detail.projectTitle || " "}</h2>
              <p className="text-caption-s flex gap-1">
                <span className="truncate">{detail.reward}</span>
                <span aria-hidden>·</span>
                <span className="shrink-0">{detail.quantity}개</span>
              </p>
            </div>
          </div>
          <FundingActionButtons actions={detail.actions} />
        </section>

        {/* card_fdinfo_item(2323:53155): 위 테두리, 좌우 20px·위아래 16px. */}
        <section className="border-border-default flex flex-col gap-4 border-t px-5 py-4">
          <h2 className="text-body-strong">펀딩 정보</h2>
          <dl className="flex flex-col gap-2">
            {/* 참여일(2323:53162)은 BE #181의 createdAt이다. 그 전 응답이면 행을 숨긴다. */}
            {detail.participatedAt && (
              <InfoRow label="참여일">
                <span className="text-body-s">{detail.participatedAt}</span>
              </InfoRow>
            )}
            {detail.paidAt && (
              <InfoRow label="결제일">
                <span className="text-body-s">{detail.paidAt}</span>
              </InfoRow>
            )}
            {detail.items.map((item, index) => (
              <Fragment key={index}>
                <InfoRow label="리워드">
                  <span className="text-caption-m">{item.reward}</span>
                </InfoRow>
                <InfoRow label="옵션 · 수량">
                  <span className="text-caption-m">{item.option}</span>
                </InfoRow>
              </Fragment>
            ))}
          </dl>
          <div className="flex items-end justify-between gap-3">
            <p className="text-body-emphasis">펀딩 금액</p>
            <p className="text-title-s">{formatWon(detail.amount)}</p>
          </div>
        </section>

        {children}
      </div>
    </FundingDetailScreen>
  );
}

/** 데모 id(`/my/fundings/in_progress` 등) 경로. 실주문과 같은 화면을 목업 응답으로 그린다. */
export function FundingDetailDemo({ fundingId }: { fundingId: string }) {
  return <FundingDetail detail={toFundingDetailView(demoOrderDetail(fundingId))} />;
}
