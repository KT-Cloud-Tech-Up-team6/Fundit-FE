"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOwnedProject,
  getFulfillment,
  transitionStage,
  saveStageDetail,
  changeSchedule,
  stages,
  stageNames,
  reasons,
  type Fulfillment,
  type Stage,
} from "@/entities/fulfillment/api/fulfillment-api";
import {
  ProjectPageHeader,
  ProjectWorkspaceLayout,
  projectManageTabs,
} from "@/entities/project/ui/project-sidebar";
import { Button } from "@/shared/components/ui/button";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { Icon } from "@/shared/components/ui/icon";
import { StageTabs } from "./stage-tabs";
import { StageTimeline } from "./stage-timeline";
import { FulfillmentAccess } from "./fulfillment-access";
import { fulfillmentState, viewStage, dateInKorea } from "../model/fulfillment-api-state";
import { ShippingBoard } from "@/features/shipping-info/ui/shipping-board";

export function SellerFulfillmentApi({
  projectId,
  shipping = false,
}: {
  projectId: string;
  shipping?: boolean;
}) {
  return (
    <FulfillmentAccess>
      {(memberId) => (
        <Seller
          key={`${memberId}:${projectId}`}
          memberId={memberId}
          projectId={projectId}
          shipping={shipping}
        />
      )}
    </FulfillmentAccess>
  );
}
function Seller({
  memberId,
  projectId,
  shipping,
}: {
  memberId: string;
  projectId: string;
  shipping: boolean;
}) {
  const owner = useQuery({
    queryKey: ["fulfillment-owner", memberId, projectId],
    queryFn: ({ signal }) => getOwnedProject(projectId, signal),
  });
  const status = useQuery({
    queryKey: ["fulfillment", projectId],
    queryFn: ({ signal }) => getFulfillment(projectId, signal),
    enabled: owner.isSuccess && !shipping,
  });
  if (owner.isPending) return <p role="status">프로젝트 권한을 확인하고 있습니다.</p>;
  if (owner.isError)
    return (
      <QueryErrorState
        error={owner.error}
        onRetry={() => void owner.refetch()}
        notFoundHref="/seller/projects"
      />
    );
  return (
    <ProjectWorkspaceLayout
      activeTab="fulfillment"
      backHref={shipping ? `/seller/projects/${projectId}?tab=fulfillment` : undefined}
      backLabel={shipping ? "제작 · 배송" : undefined}
      projectId={projectId}
      projectName={owner.data.title}
      tabs={projectManageTabs}
    >
      <div className="max-w-[792px] min-w-0 flex-1">
        {shipping ? (
          <ShippingBoard projectId={projectId} />
        ) : (
          <>
            <ProjectPageHeader
              breadcrumb={["내 프로젝트", "제작 · 배송"]}
              title="제작·배송"
              action={
                <Link
                  className="bg-layer-surface-primary text-text-inverse hover:bg-layer-surface-primary-hover focus-visible:outline-border-primary text-body-s flex h-10 w-[180px] shrink-0 items-center justify-center gap-1 rounded-xs font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2"
                  href={`/seller/projects/${projectId}/shipping`}
                >
                  발송 정보
                  <Icon className="size-5" name="transferVan" />
                </Link>
              }
            />
            {status.isPending ? (
              <p role="status">제작 현황을 불러오고 있습니다.</p>
            ) : status.isError ? (
              <QueryErrorState
                variant="section"
                error={status.error}
                description="제작 현황을 불러오지 못했습니다."
                onRetry={() => void status.refetch()}
                notFoundHref="/seller/projects"
              />
            ) : (
              <Editor memberId={memberId} projectId={projectId} data={status.data} />
            )}
          </>
        )}
      </div>
    </ProjectWorkspaceLayout>
  );
}
function Editor({
  memberId,
  projectId,
  data,
}: {
  memberId: string;
  projectId: string;
  data: Fulfillment;
}) {
  const client = useQueryClient();
  const [selected, setSelected] = useState<Stage>(data.currentStage);
  const current = data.stages.find((item) => item.stage === selected);
  const state = fulfillmentState(data);
  const [text, setText] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [date, setDate] = useState(""),
    [reason, setReason] = useState<keyof typeof reasons>("START_DELAY"),
    [reasonDetail, setReasonDetail] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const saving = useRef(false);
  const index = stages.indexOf(data.currentStage),
    next = stages[index + 1];
  async function mutate(action: () => Promise<unknown>, success: () => void) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      success();
      await client.invalidateQueries({ queryKey: ["fulfillment", projectId] });
      setNotice("저장했습니다.");
    } catch {
      setError("저장하지 못했습니다. 권한과 최신 상태를 확인한 뒤 다시 시도해주세요.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  const fieldClass = "border-border-default w-full rounded-xs border p-3";
  return (
    <section className="mt-3 space-y-5" key={memberId}>
      {data.isUpdateOverdue && (
        <p role="status" className="bg-layer-bg p-4">
          진행 현황 업데이트가 필요합니다.
        </p>
      )}
      <StageTabs
        state={state}
        selected={viewStage[selected]}
        onSelect={(value) => {
          if (busy) return;
          const stage = stages.find((item) => viewStage[item] === value);
          if (stage) {
            setSelected(stage);
            setText("");
            setStart("");
            setEnd("");
            setDate("");
            setReasonDetail("");
            setNotice("");
            setError("");
          }
        }}
      />
      <p>현재 단계. {stageNames[data.currentStage]}</p>
      <p>
        예상 일정. {dateInKorea(current?.plannedStartAt) || "미정"} ~{" "}
        {dateInKorea(current?.plannedEndAt) || "미정"}
      </p>
      <h2 className="text-title-s">최신 진행 기록</h2>
      <StageTimeline records={state[viewStage[selected]].records} onSelectMedia={() => {}} />
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {current?.status === "IN_PROGRESS" && (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (text.trim())
                void mutate(
                  () =>
                    saveStageDetail(projectId, {
                      stage: selected,
                      detailText: text.trim(),
                      plannedStartAt: start
                        ? new Date(`${start}T00:00:00+09:00`).toISOString()
                        : current?.plannedStartAt,
                      plannedEndAt: end
                        ? new Date(`${end}T00:00:00+09:00`).toISOString()
                        : current?.plannedEndAt,
                    }),
                  () => setText(""),
                );
            }}
          >
            <fieldset disabled={busy} className="space-y-3">
              <legend className="text-title-s">진행 기록 등록</legend>
              <label className="block">
                예상 시작일 (한국 시간)
                <input
                  type="date"
                  className={fieldClass}
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </label>
              <label className="block">
                예상 종료일 (한국 시간)
                <input
                  type="date"
                  className={fieldClass}
                  min={start || undefined}
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </label>
              <label className="block">
                진행 내용
                <textarea
                  required
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className={fieldClass}
                />
              </label>
              <Button type="submit" disabled={!text.trim()}>
                기록 등록
              </Button>
            </fieldset>
          </form>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (date)
                void mutate(
                  () =>
                    changeSchedule(projectId, {
                      stage: selected,
                      reasonType: reason,
                      reasonDetail: reasonDetail.trim(),
                      newPlannedDate: new Date(`${date}T00:00:00+09:00`).toISOString(),
                    }),
                  () => {
                    setDate("");
                    setReasonDetail("");
                  },
                );
            }}
          >
            <fieldset disabled={busy} className="space-y-3">
              <legend className="text-title-s">일정 변경</legend>
              <label className="block">
                변경 사유
                <select
                  className={fieldClass}
                  value={reason}
                  onChange={(event) => setReason(event.target.value as keyof typeof reasons)}
                >
                  {Object.entries(reasons).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                상세 사유
                <textarea
                  required={reason === "OTHER"}
                  value={reasonDetail}
                  onChange={(event) => setReasonDetail(event.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="block">
                변경 일정 (한국 시간)
                <input
                  required
                  type="date"
                  className={fieldClass}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>
              <Button
                type="submit"
                disabled={!date || (reason === "OTHER" && !reasonDetail.trim())}
              >
                일정 변경 등록
              </Button>
            </fieldset>
          </form>
        </>
      )}
      {selected === data.currentStage && next && (
        <Button
          disabled={busy}
          onClick={() =>
            void mutate(
              () => transitionStage(projectId, next),
              () => setSelected(next),
            )
          }
        >
          {stageNames[data.currentStage]} 완료하고 {stageNames[next]} 시작
        </Button>
      )}
      {data.scheduleChanges.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-title-s">일정 변경 이력</h2>
          {data.scheduleChanges.map((item) => (
            <p key={item.scheduleChangeId}>
              {stageNames[item.stage]} · {reasons[item.reasonType]} ·{" "}
              {dateInKorea(item.newPlannedDate)} {item.reasonDetail}
            </p>
          ))}
        </section>
      )}
      <Link className="block underline" href={`/seller/projects/${projectId}/shipping`}>
        발송 정보
      </Link>
    </section>
  );
}
