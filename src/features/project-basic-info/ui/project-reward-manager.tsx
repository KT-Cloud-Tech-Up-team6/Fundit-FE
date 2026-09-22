"use client";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import {
  getSellerRewards,
  saveReward as persistReward,
  deleteReward,
  type RewardResponse,
} from "@/entities/project/api/reward-api";
import { uploadProjectMedia, ProjectMediaValidationError } from "@/entities/project/api/media-api";
import { Button } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";
import { TextButton } from "@/shared/components/ui/text-button";
import { ProjectSidebar, projectEditTabs } from "@/entities/project/ui/project-sidebar";
import {
  discountedPrice,
  emptyReward,
  rewardError,
  type RewardDraft,
  type DemoReward,
} from "../model/basic-info-demo";
import { rewardOptionsError, rewardRequest, rewardToDraft } from "../model/reward-request";
import { RewardFormModal } from "./reward-form-modal";
import { createRewardOnce, RewardCreationUncertainError } from "../model/reward-create-attempt";

export function ProjectRewardManager({ projectId }: { projectId: string }) {
  const { state } = useAuth();
  const cache = useQueryClient();
  const queryKey = ["seller-rewards", state.user?.memberId, projectId];
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => getSellerRewards(projectId, signal),
    enabled: state.status === "authenticated" && Boolean(state.user?.memberId),
  });
  const rewards = (query.data ?? []).map(rewardToDraft);
  const [draft, setDraft] = useState<RewardDraft | null>(null),
    [editing, setEditing] = useState<number | undefined>();
  const [rewardMessage, setRewardMessage] = useState(""),
    [formMessage, setFormMessage] = useState("");
  const pending = useRef(false),
    file = useRef<File | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const optionsChanged = useRef(false);
  function openReward(reward?: DemoReward) {
    if (pending.current) return;
    file.current = undefined;
    optionsChanged.current = !reward;
    setEditing(reward?.id);
    setDraft(reward ?? emptyReward());
    setRewardMessage("");
  }
  function closeReward() {
    if (pending.current) return;
    setDraft(null);
  }
  async function saveReward() {
    if (!draft || pending.current) return;
    const error =
      rewardError(draft) ||
      rewardOptionsError(draft) ||
      (!draft.description.trim() ? "리워드 설명을 입력해주세요." : "");
    if (error) {
      setRewardMessage(error);
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      const imageUrl = file.current
        ? await uploadProjectMedia(projectId, file.current, "image")
        : undefined;
      const body = rewardRequest(draft, imageUrl, optionsChanged.current);
      let saved: RewardResponse;
      if (editing === undefined) {
        if (!state.user?.memberId) throw new Error("로그인이 필요합니다.");
        saved = await createRewardOnce(sessionStorage, state.user.memberId, projectId, body);
      } else {
        saved = await persistReward(projectId, body, editing);
      }
      cache.setQueryData<RewardResponse[]>(queryKey, (items = []) => {
        const previous = items.find((item) => item.rewardId === saved.rewardId);
        const updated = {
          ...saved,
          options: !optionsChanged.current && previous ? previous.options : saved.options,
        };
        return previous
          ? items.map((item) => (item.rewardId === saved.rewardId ? updated : item))
          : [...items, updated];
      });
      void cache.invalidateQueries({ queryKey });
      setDraft(null);
    } catch (error) {
      setRewardMessage(
        error instanceof RewardCreationUncertainError ||
          error instanceof ProjectMediaValidationError
          ? error.message
          : "리워드를 저장하지 못했습니다. 입력 내용을 유지했으니 다시 시도해주세요.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function removeReward(id: number) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setFormMessage("");
    try {
      await deleteReward(id);
      await cache.invalidateQueries({ queryKey });
    } catch {
      setFormMessage("리워드를 삭제하지 못했습니다. 다시 시도해주세요.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (state.status === "checking") return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  if (state.status === "guest") return <LoginRedirect />;
  if (!state.user?.memberId)
    return <p role="alert">회원 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>;
  if (query.isPending) return <p role="status">리워드를 불러오고 있습니다.</p>;
  if (query.isError)
    return (
      <p role="alert">
        리워드를 불러오지 못했습니다.{" "}
        <button onClick={() => void query.refetch()}>다시 시도</button>
      </p>
    );
  return (
    <>
      <fieldset disabled={busy}>
        <section className="mt-[45px]" aria-labelledby="rewards">
          <h2 id="rewards" className="text-title-s text-text-title">
            리워드
          </h2>
          <p className="text-caption-s text-text-default mt-1">
            후원자에게 제공할 리워드를 등록해주세요. 최소 1개 이상 등록해야 다음 단계로 진행할 수
            있어요
          </p>
          {rewards.length ? (
            <div className="mt-2 flex w-full flex-col items-end gap-4">
              <div className="w-full overflow-x-auto">
                <div className="border-w-xs border-border-default min-w-[792px] overflow-hidden rounded-xs border">
                  <table className="text-body-m w-full table-fixed text-left">
                    <caption className="sr-only">등록된 리워드</caption>
                    <thead className="bg-layer-bg block">
                      <tr className="grid h-[42px] grid-cols-[26px_231px_minmax(0,1fr)_83px_70px_99px] items-center gap-4 px-2">
                        {["No.", "리워드명", "가격", "수량", "할인", "관리"].map((label) => (
                          <th key={label} scope="col" className="min-w-0 font-medium">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="block">
                      {rewards.map((reward, index) => (
                        <tr
                          key={reward.id}
                          className="border-border-default grid h-11 grid-cols-[26px_231px_minmax(0,1fr)_83px_70px_99px] items-center gap-4 border-t px-2"
                        >
                          <td className="text-center font-semibold">{index + 1}</td>
                          <td className="min-w-0 truncate" title={reward.name}>
                            {reward.name}
                          </td>
                          <td className="min-w-0">
                            {reward.discount ? (
                              <div className="flex min-w-0 items-center justify-end gap-2">
                                <s
                                  className="text-caption-s text-text-secondary max-w-[45%] min-w-0 truncate whitespace-nowrap"
                                  title={`${Number(reward.price).toLocaleString("ko-KR")}원`}
                                >
                                  {Number(reward.price).toLocaleString("ko-KR")}원
                                </s>
                                <span
                                  className="min-w-0 truncate text-right whitespace-nowrap"
                                  title={`${discountedPrice(reward).toLocaleString("ko-KR")}원`}
                                >
                                  {discountedPrice(reward).toLocaleString("ko-KR")}원
                                </span>
                              </div>
                            ) : (
                              <span
                                className="block truncate text-right whitespace-nowrap"
                                title={`${Number(reward.price).toLocaleString("ko-KR")}원`}
                              >
                                {Number(reward.price).toLocaleString("ko-KR")}원
                              </span>
                            )}
                          </td>
                          <td
                            className="min-w-0 truncate"
                            title={reward.limited ? `${reward.quantity}개` : "제한 없음"}
                          >
                            {reward.limited ? `${reward.quantity}개` : "제한 없음"}
                          </td>
                          <td>{reward.discount ? "적용" : "-"}</td>
                          <td className="flex h-10 items-center gap-2 whitespace-nowrap">
                            <TextButton
                              variant="underline"
                              showIcon={false}
                              className="text-caption-s h-10 px-2"
                              onClick={() => openReward(reward)}
                              aria-label={`${reward.name} 수정`}
                            >
                              수정
                            </TextButton>
                            <span aria-hidden className="mx-1">
                              ·
                            </span>
                            <TextButton
                              variant="underline"
                              showIcon={false}
                              className="text-caption-s h-10 px-2"
                              onClick={() => void removeReward(reward.id)}
                              aria-label={`${reward.name} 삭제`}
                            >
                              삭제
                            </TextButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                appearance="cta"
                size="md"
                className="text-body-s! w-[106px] gap-1 font-medium"
                onClick={() => openReward()}
              >
                추가 <Icon name="plus" className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="bg-layer-bg border-w-xs border-border-default mt-2 flex h-[238px] flex-col items-center justify-center rounded-sm border border-dashed">
              <div className="relative size-14">
                <Icon name="gift" className="absolute top-2.5 left-2.5 size-9" />
                <Icon name="plusCircle" className="absolute top-0 right-0 size-4" />
              </div>
              <p className="text-body-s text-text-secondary mt-2 text-center font-medium">
                등록된 리워드가 없습니다
                <br />
                리워드를 등록해주세요
              </p>
              <Button
                type="button"
                size="md"
                className="text-body-s! mt-3 h-10! w-[204px] font-medium"
                onClick={() => openReward()}
              >
                리워드 추가
              </Button>
            </div>
          )}
        </section>
        {formMessage && <p role="alert">{formMessage}</p>}
      </fieldset>
      <RewardFormModal
        draft={draft}
        editing={editing !== undefined}
        error={rewardMessage}
        onClose={closeReward}
        onSave={() => void saveReward()}
        onUpdate={(patch) => {
          if ("options" in patch || "optionGroups" in patch) optionsChanged.current = true;
          setDraft((value) => (value ? { ...value, ...patch } : value));
        }}
        busy={busy}
        onFile={(value) => {
          file.current = value;
        }}
      />
    </>
  );
}
export function ProjectRewardsPage({ projectId }: { projectId: string }) {
  return (
    <div className="mt-3 flex flex-col gap-6 lg:flex-row">
      <ProjectSidebar
        activeTab="rewards"
        projectId={projectId}
        projectName="리워드 관리"
        tabs={projectEditTabs}
      />
      <div className="min-w-0 flex-1">
        <h1 className="text-heading-l">리워드 관리</h1>
        <ProjectRewardManager projectId={projectId} />
      </div>
    </div>
  );
}
