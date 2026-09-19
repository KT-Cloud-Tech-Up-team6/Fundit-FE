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
import { ProjectSidebar, projectManageTabs } from "@/entities/project/ui/project-sidebar";
import { Button } from "@/shared/components/ui/button";
import { Breadcrumb } from "@/shared/components/ui/breadcrumb";
import { StageTabs } from "./stage-tabs";
import { StageTimeline } from "./stage-timeline";
import { FulfillmentAccess } from "./fulfillment-access";
import { fulfillmentState, viewStage, dateInKorea } from "../model/fulfillment-api-state";

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
      <p role="alert">
        프로젝트를 조회할 권한이 없거나 조회하지 못했습니다.{" "}
        <button onClick={() => void owner.refetch()}>다시 시도</button>
      </p>
    );
  return (
    <div className="mt-3 flex flex-col gap-6 lg:flex-row">
      <ProjectSidebar
        activeTab="fulfillment"
        projectId={projectId}
        projectName={owner.data.title}
        tabs={projectManageTabs}
        className="lg:mt-9"
      />
      <div className="max-w-[792px] min-w-0 flex-1">
        <Breadcrumb items={["내 프로젝트", "제작 · 배송"]} />
        {shipping ? (
          <section className="space-y-4 py-8">
            <h1 className="text-title-l">발송 정보</h1>
            <p>발송 대상 목록 연결을 준비 중입니다.</p>
            <Link className="underline" href={`/seller/projects/${projectId}?tab=fulfillment`}>
              제작 · 배송으로 돌아가기
            </Link>
          </section>
        ) : status.isPending ? (
          <p role="status">제작 현황을 불러오고 있습니다.</p>
        ) : status.isError ? (
          <p role="alert">
            제작 현황이 아직 없거나 조회하지 못했습니다.{" "}
            <button onClick={() => void status.refetch()}>다시 시도</button>
          </p>
        ) : (
          <Editor memberId={memberId} projectId={projectId} data={status.data} />
        )}
      </div>
    </div>
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
    <section className="space-y-5 py-6" key={memberId}>
      <h1 className="text-title-l">제작 · 배송</h1>
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
