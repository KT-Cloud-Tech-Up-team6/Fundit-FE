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
import { ProjectMediaValidationError, uploadProjectMedia } from "@/entities/project/api/media-api";
import { isApiError } from "@/shared/api/api-error";
import { Button } from "@/shared/components/ui/button";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { Icon } from "@/shared/components/ui/icon";
import { MediaDropzone } from "./media-dropzone";
import { MediaLightbox } from "./media-lightbox";
import { StageTabs } from "./stage-tabs";
import { StageTimeline } from "./stage-timeline";
import { FulfillmentAccess } from "./fulfillment-access";
import type { MediaItem, MediaLimit } from "../model/fulfillment-demo";
import { fulfillmentState, viewStage, dateInKorea } from "../model/fulfillment-api-state";
import type { ShippingView } from "@/features/shipping-info/model/seller-shipment";
import { ShippingBoardApi } from "@/features/shipping-info/ui/shipping-board-api";

/** `shipping`이 있으면 발송정보 화면이다. URL에서 읽은 탭·검색어·페이지를 담는다. */
export function SellerFulfillmentApi({
  projectId,
  shipping,
}: {
  projectId: string;
  shipping?: ShippingView;
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
  shipping?: ShippingView;
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
      {/* 발송정보 표는 8열(최소 940px)이라 데모 화면처럼 폭 제한 없이 둔다. */}
      <div className={shipping ? "min-w-0 flex-1" : "max-w-[792px] min-w-0 flex-1"}>
        {shipping ? (
          <ShippingBoardApi memberId={memberId} projectId={projectId} {...shipping} />
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
/** BE stage-details는 사진만 최대 5장 받는다. 동영상은 받지 않아 0으로 둔다. */
const photoLimit: MediaLimit = { image: 5, video: 0 };

class PhotoUploadError extends Error {}

/**
 * 첨부한 사진을 모두 올리고 fileUrl을 순서대로 돌려준다.
 * 하나라도 실패하면 어떤 사진이 실패했는지 담아 던져 기록 등록까지 막는다.
 */
async function uploadPhotos(projectId: string, photos: MediaItem[]) {
  const results = await Promise.all(
    photos.map(async (item) => {
      try {
        if (!item.file) throw new Error("첨부 파일을 찾을 수 없습니다.");
        const url = await uploadProjectMedia(projectId, item.file, "image");
        return { name: item.name, url, reason: "" };
      } catch (error) {
        return {
          name: item.name,
          url: null,
          reason: error instanceof ProjectMediaValidationError ? error.message : "",
        };
      }
    }),
  );
  const urls: string[] = [];
  const failed: { name: string; reason: string }[] = [];
  for (const item of results) {
    if (item.url) urls.push(item.url);
    else failed.push(item);
  }
  if (failed.length)
    throw new PhotoUploadError(
      `${failed.map((item) => item.name).join(", ")} 사진을 올리지 못해 기록을 등록하지 않았습니다. ${
        failed.find((item) => item.reason)?.reason ?? "잠시 후 다시 시도해주세요."
      }`,
    );
  return urls;
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
  const [photos, setPhotos] = useState<MediaItem[]>([]),
    [preview, setPreview] = useState<MediaItem | null>(null);
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
    } catch (failure) {
      /* 이미 지난 단계는 되돌릴 수 없어, 안내와 함께 서버의 최신 단계를 다시 불러온다. */
      if (isApiError(failure) && failure.code === "INVALID_STAGE_TRANSITION") {
        setError("이미 지난 단계입니다. 최신 진행 상태를 다시 불러왔습니다.");
        await client.invalidateQueries({ queryKey: ["fulfillment", projectId] });
      } else if (failure instanceof PhotoUploadError) {
        setError(failure.message);
      } else {
        setError("저장하지 못했습니다. 권한과 최신 상태를 확인한 뒤 다시 시도해주세요.");
      }
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
            setPhotos([]);
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
      <StageTimeline records={state[viewStage[selected]].records} onSelectMedia={setPreview} />
      <MediaLightbox media={preview} onClose={() => setPreview(null)} />
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {current?.status === "IN_PROGRESS" && (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (text.trim())
                void mutate(
                  async () => {
                    const photoUrls = await uploadPhotos(projectId, photos);
                    await saveStageDetail(projectId, {
                      stage: selected,
                      detailText: text.trim(),
                      photoUrls: photoUrls.length ? photoUrls : undefined,
                      plannedStartAt: start
                        ? new Date(`${start}T00:00:00+09:00`).toISOString()
                        : current?.plannedStartAt,
                      plannedEndAt: end
                        ? new Date(`${end}T00:00:00+09:00`).toISOString()
                        : current?.plannedEndAt,
                    });
                  },
                  () => {
                    setText("");
                    setPhotos([]);
                  },
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
              <div className="space-y-2">
                <p className="text-body-s">사진 첨부 (선택, 최대 {photoLimit.image}장)</p>
                <MediaDropzone
                  limit={photoLimit}
                  media={photos}
                  onChange={setPhotos}
                  onPreview={setPreview}
                />
              </div>
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
