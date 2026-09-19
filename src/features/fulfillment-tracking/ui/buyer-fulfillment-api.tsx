"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  findFundingProject,
  getFulfillment,
  getShipment,
  confirmReceipt,
  stageNames,
  reasons,
  type Shipment,
} from "@/entities/fulfillment/api/fulfillment-api";
import { Button } from "@/shared/components/ui/button";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";
import { FulfillmentAccess } from "./fulfillment-access";
import { BuyerStageStepper } from "./buyer-stage-stepper";
import { BuyerTimeline } from "./buyer-timeline";
import { fulfillmentState, viewStage, dateInKorea } from "../model/fulfillment-api-state";

export function BuyerFulfillmentApi({
  fundingId,
  history = false,
}: {
  fundingId: string;
  history?: boolean;
}) {
  return (
    <FulfillmentAccess>
      {(memberId) => (
        <Buyer
          key={`${memberId}:${fundingId}`}
          memberId={memberId}
          fundingId={fundingId}
          history={history}
        />
      )}
    </FulfillmentAccess>
  );
}
function Buyer({
  memberId,
  fundingId,
  history,
}: {
  memberId: string;
  fundingId: string;
  history: boolean;
}) {
  const order = useQuery({
    queryKey: ["funding-project", memberId, fundingId],
    queryFn: ({ signal }) => findFundingProject(fundingId, signal),
  });
  if (order.isPending) return <p role="status">참여 내역을 확인하고 있습니다.</p>;
  if (order.isError)
    return (
      <p role="alert">
        참여 내역을 확인할 수 없습니다.{" "}
        <button onClick={() => void order.refetch()}>다시 시도</button>
      </p>
    );
  return (
    <Tracking
      memberId={memberId}
      fundingId={fundingId}
      projectId={order.data.projectId}
      title={order.data.projectTitle}
      history={history}
    />
  );
}
function Tracking({
  memberId,
  fundingId,
  projectId,
  title,
  history,
}: {
  memberId: string;
  fundingId: string;
  projectId: string;
  title: string;
  history: boolean;
}) {
  const status = useQuery({
    queryKey: ["fulfillment", projectId],
    queryFn: ({ signal }) => getFulfillment(projectId, signal),
  });
  const shipment = useQuery({
    queryKey: ["shipment", memberId, projectId, fundingId],
    queryFn: ({ signal }) => getShipment(projectId, fundingId, signal),
  });
  const data = status.data,
    state = data ? fulfillmentState(data) : null;
  const route = `/my/fundings/${fundingId}/fulfillment`;
  return (
    <>
      <BuyerDesktopHeader />
      <main className="bg-layer-bg min-h-dvh w-full min-[1200px]:mx-auto min-[1200px]:max-w-300 min-[1200px]:p-8">
        <header className="bg-layer-surface-default flex items-center gap-3 p-5">
          <Link className="underline" href={history ? route : `/my/fundings/${fundingId}`}>
            뒤로
          </Link>
          <h1 className="text-title-s min-w-0 truncate">{title || "제작·배송 현황"}</h1>
        </header>
        <div className="grid gap-3 min-[1200px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="bg-layer-surface-default space-y-5 p-5">
            {status.isPending ? (
              <p role="status">제작 현황을 불러오고 있습니다.</p>
            ) : status.isError ? (
              <p role="alert">
                제작 현황이 아직 없거나 조회하지 못했습니다.{" "}
                <button onClick={() => void status.refetch()}>다시 시도</button>
              </p>
            ) : (
              data &&
              state && (
                <>
                  <h2 className="text-title-s">현재 {stageNames[data.currentStage]} 단계입니다.</h2>
                  {data.isUpdateOverdue && (
                    <p role="status">진행 현황 업데이트가 지연되고 있습니다.</p>
                  )}
                  <BuyerStageStepper state={state} showExpectedStartTooltip />
                  <h2 className="text-title-s">
                    {history ? "단계별 최신 기록" : "최신 진행 기록"}
                  </h2>
                  {history ? (
                    data.stages.map((item) => (
                      <section className="space-y-3" key={item.stage}>
                        <h3>{stageNames[item.stage]}</h3>
                        <p>
                          {dateInKorea(item.plannedStartAt) || "미정"} ~{" "}
                          {dateInKorea(item.plannedEndAt) || "미정"}
                        </p>
                        <BuyerTimeline
                          records={state[viewStage[item.stage]].records}
                          onSelectMedia={() => {}}
                          showLatestBadge={false}
                        />
                      </section>
                    ))
                  ) : (
                    <BuyerTimeline
                      records={state[viewStage[data.currentStage]].records}
                      onSelectMedia={() => {}}
                    />
                  )}
                  {!history && (
                    <Link className="block underline" href={`${route}/history`}>
                      세부 진행 기록 더보기
                    </Link>
                  )}
                  <section className="space-y-3">
                    <h2 className="text-title-s">일정 변경 이력</h2>
                    {data.scheduleChanges.map((item) => (
                      <article key={item.scheduleChangeId}>
                        <p>
                          {stageNames[item.stage]} · {reasons[item.reasonType]}
                        </p>
                        <p>
                          {dateInKorea(item.oldPlannedDate) || "미정"} →{" "}
                          {dateInKorea(item.newPlannedDate)}
                        </p>
                        <p>{item.reasonDetail}</p>
                      </article>
                    ))}
                    {!data.scheduleChanges.length && <p>일정 변경 이력이 없습니다.</p>}
                  </section>
                </>
              )
            )}
          </section>
          <section className="bg-layer-surface-default space-y-3 p-5">
            <h2 className="text-title-s">배송 현황</h2>
            {shipment.isPending ? (
              <p role="status">배송 현황을 불러오고 있습니다.</p>
            ) : shipment.isError ? (
              <p role="alert">
                배송 조회 실패. <button onClick={() => void shipment.refetch()}>다시 시도</button>
              </p>
            ) : (
              <Receipt
                memberId={memberId}
                projectId={projectId}
                fundingId={fundingId}
                data={shipment.data}
              />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
function Receipt({
  memberId,
  projectId,
  fundingId,
  data,
}: {
  memberId: string;
  projectId: string;
  fundingId: string;
  data: Shipment;
}) {
  const client = useQueryClient(),
    saving = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function confirm() {
    if (saving.current || !data.canConfirmReceipt) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await confirmReceipt(projectId, fundingId);
      await client.invalidateQueries({ queryKey: ["shipment", memberId, projectId, fundingId] });
    } catch {
      setError("수령 확인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  const labels: Record<string, string> = {
    PREPARING: "배송 준비",
    SHIPPED: "발송 완료",
    DELIVERED: "배송 완료",
    RECEIPT_CONFIRMED: "수령 확인",
  };
  return (
    <>
      <p>{labels[data.status] ?? data.status}</p>
      {data.carrier && <p>택배사 {data.carrier}</p>}
      {data.trackingNumber && <p>송장번호 {data.trackingNumber}</p>}
      {data.shippedAt && <p>발송일 {dateInKorea(data.shippedAt)}</p>}
      {data.deliveredAt && <p>배송 완료일 {dateInKorea(data.deliveredAt)}</p>}
      {data.receiptConfirmedAt && <p>수령 확인일 {dateInKorea(data.receiptConfirmedAt)}</p>}
      {error && <p role="alert">{error}</p>}
      {data.canConfirmReceipt && (
        <Button disabled={busy} onClick={() => void confirm()}>
          수령 확인
        </Button>
      )}
    </>
  );
}
