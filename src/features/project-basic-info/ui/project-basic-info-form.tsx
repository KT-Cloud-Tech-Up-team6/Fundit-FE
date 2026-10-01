"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ProjectRewardManager } from "./project-reward-manager";
import { ApiError } from "@/shared/api/api-error";
import { mainCategories, subcategoriesByMain } from "@/entities/category/model/project-categories";
import { ProjectPageHeader } from "@/entities/project/ui/project-sidebar";
import { Button } from "@/shared/components/ui/button";
import { Chip } from "@/shared/components/ui/chip";
import { Dropdown } from "@/shared/components/ui/dropdown";
import { Icon } from "@/shared/components/ui/icon";
import { Input } from "@/shared/components/ui/input";
import { Radio } from "@/shared/components/ui/radio";
import { TextButton } from "@/shared/components/ui/text-button";
import {
  addAmount,
  amountSteps,
  businessTypes,
  demoRewards,
  discountedPrice,
  emptyReward,
  upsertReward,
  type DemoReward,
  type RewardDraft,
} from "../model/basic-info-demo";
import { RewardFormModal } from "./reward-form-modal";
import {
  basicInfoFieldErrors,
  basicInfoFields,
  basicInfoRequest,
  type BasicInfoField,
  type BasicInfoLevel,
  type BasicInfoValues,
} from "../model/basic-info-request";
import { ProjectCreationUncertainError } from "../model/project-create-attempt";
import { RewardBatchError } from "../model/reward-create-attempt";
import { rewardSaveError } from "../model/reward-request";
import { validateProjectMedia } from "@/entities/project/api/media-api";
import { isPublicUuid } from "@/shared/lib/public-uuid";

export type BasicInfoPreview = "empty" | "adding" | "list" | "list-adding";
const createBreadcrumb = ["내 프로젝트", "신규 생성하기", "기본 정보 등록"];
const editBreadcrumb = ["내 프로젝트", "기본 정보 수정"];

export function ProjectBasicInfoForm({
  initialView = "empty",
  initialValues,
  mode = "create",
  onSave,
  statusMessage,
}: {
  initialView?: BasicInfoPreview;
  initialValues?: Partial<BasicInfoValues>;
  mode?: "create" | "edit";
  onSave?: (
    values: BasicInfoValues,
    partial: boolean,
    rewards: DemoReward[],
    onRewardRegistered: (id: number) => void,
  ) => Promise<void>;
  statusMessage?: string;
}) {
  const [business, setBusiness] = useState(initialValues?.business ?? "");
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [subcategory, setSubcategory] = useState(initialValues?.subcategory ?? "");
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  /* 리워드 모달에서 고른 이미지. 프로젝트가 생긴 뒤에야 올릴 수 있어 리워드와 함께 들고 있는다. */
  const rewardFile = useRef<File | undefined>(undefined);
  /* 저장을 눌러 본 뒤에만 칸별 오류를 보인다. 그 뒤로는 값을 고치는 대로 오류가 사라진다. */
  const [attempt, setAttempt] = useState<BasicInfoLevel | null>(null);
  /* 편집 화면의 리워드는 서버 목록으로 관리한다. 그 개수를 리워드 관리 영역이 알려준다. */
  const [serverRewardCount, setServerRewardCount] = useState<number | undefined>();
  const [rewards, setRewards] = useState<DemoReward[]>(() =>
    initialView.startsWith("list") ? demoRewards.map((reward) => ({ ...reward })) : [],
  );
  const [editing, setEditing] = useState<DemoReward | "new" | null>(
    initialView.includes("adding") ? "new" : null,
  );
  const [draft, setDraft] = useState<RewardDraft | null>(
    initialView.includes("adding") ? emptyReward() : null,
  );
  const [rewardMessage, setRewardMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formMessageRole, setFormMessageRole] = useState<"alert" | "status">("status");
  const nextId = useRef(3);
  const params = useParams<{ projectId?: string }>();
  const apiProjectId = isPublicUuid(params?.projectId) ? params.projectId : undefined;
  const subcategoryOptions = category ? (subcategoriesByMain[category] ?? []) : [];
  const values = { business, title, category, subcategory, amount };
  const rewardCount = apiProjectId ? serverRewardCount : rewards.length;
  const errors = attempt ? basicInfoFieldErrors(values, attempt, rewardCount) : {};
  const invalid = (field: BasicInfoField) => (errors[field] ? true : undefined);
  const describedBy = (field: BasicInfoField) => (errors[field] ? `${field}-error` : undefined);
  const fieldError = (field: BasicInfoField, text = errors[field]) =>
    text && (
      <p id={`${field}-error`} className="text-caption-s text-text-warning mt-1">
        {text}
      </p>
    );
  function focusField(field: BasicInfoField) {
    const target = formRef.current?.querySelector<HTMLElement>(`[data-field="${field}"]`);
    const focusable = target?.matches("input,button")
      ? target
      : target?.querySelector<HTMLElement>("input:not(:disabled),button:not(:disabled)");
    focusable?.focus();
  }

  function updateDraft(patch: Partial<RewardDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setRewardMessage("");
  }
  function openReward(reward?: DemoReward) {
    setEditing(reward ?? "new");
    setDraft(reward ? { ...reward } : emptyReward());
    rewardFile.current = reward?.file;
    setRewardMessage("");
  }
  function closeReward() {
    rewardFile.current = undefined;
    setEditing(null);
    setDraft(null);
    setRewardMessage("");
  }
  function saveReward() {
    if (!draft) return;
    const error = rewardSaveError(draft);
    if (error) return setRewardMessage(error);
    const id = editing === "new" ? nextId.current++ : editing?.id;
    if (id === undefined) return;
    const file = rewardFile.current;
    setRewards((current) =>
      upsertReward(current, draft, id).map((item) => (item.id === id ? { ...item, file } : item)),
    );
    setFormMessage("");
    closeReward();
  }
  async function saveBasicInfo(partial = false) {
    if (savingRef.current) return;
    const level = partial ? "draft" : "full";
    const found = basicInfoFieldErrors(values, level, rewardCount);
    const first = basicInfoFields.find((field) => found[field]);
    setAttempt(level);
    if (first) {
      setFormMessageRole("alert");
      setFormMessage(
        level === "draft"
          ? "입력 내용을 확인해주세요. 표시된 항목을 고치면 임시저장할 수 있습니다."
          : "필수정보 입력이 필요합니다. 표시된 항목을 확인해주세요.",
      );
      return focusField(first);
    }
    if (partial && onSave && !Object.keys(basicInfoRequest(values)).length && !rewards.length) {
      setFormMessageRole("alert");
      return setFormMessage("저장할 기본 정보를 입력해주세요.");
    }
    if (onSave) {
      savingRef.current = true;
      setSaving(true);
      try {
        await onSave(values, partial, rewards, (id) =>
          setRewards((current) =>
            current.map((item) => (item.id === id ? { ...item, registered: true } : item)),
          ),
        );
        setAttempt(null);
        setFormMessageRole("status");
        setFormMessage(
          mode === "edit" ? "기본 정보를 저장했습니다." : "기본 정보와 리워드를 저장했습니다.",
        );
      } catch (error) {
        /* 결과를 모르는 리워드는 고치면 같은 멱등 키에 다른 본문이 가 409가 난다. 잠가 두고 다시 저장하면
           같은 내용으로 이어서 확인한다. */
        if (error instanceof RewardBatchError && error.uncertain)
          setRewards((current) =>
            current.map((item) => (item.id === error.rewardId ? { ...item, pending: true } : item)),
          );
        setFormMessageRole("alert");
        setFormMessage(
          error instanceof ProjectCreationUncertainError || error instanceof RewardBatchError
            ? error.message
            : error instanceof ApiError && error.code === "INVALID_CATEGORY"
              ? "선택한 카테고리를 저장할 수 없습니다. 대분류와 상세 카테고리를 다시 선택해주세요."
              : "기본 정보를 저장하지 못했습니다. 입력 내용을 유지했으니 다시 시도해 주세요.",
        );
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
      return;
    }
    setFormMessageRole("status");
    setFormMessage("목업 저장입니다. 실제 프로젝트를 생성하거나 다음 단계로 이동하지 않습니다.");
  }

  return (
    <>
      <form
        ref={formRef}
        className={`flex min-h-[calc(100vh-92px)] flex-col ${mode === "create" ? "pt-3" : ""}`}
        onSubmit={(event) => {
          event.preventDefault();
          void saveBasicInfo();
        }}
        onChange={() => setFormMessage("")}
      >
        <fieldset disabled={saving} className="mx-auto w-full max-w-198 min-w-0">
          <ProjectPageHeader
            breadcrumb={mode === "edit" ? editBreadcrumb : createBreadcrumb}
            title={mode === "edit" ? "기본 정보 수정" : "기본 정보 등록"}
          />
          {statusMessage && (
            <p role="status" className="text-body-s mt-3">
              {statusMessage}
            </p>
          )}
          <div className="mt-3 space-y-6">
            <fieldset data-field="business">
              <legend className="text-title-s mb-2">사업자 유형</legend>
              {/* Figma FL_S_PR_CREATE: 선택지는 28px 라디오를 기준으로 가로로 나열된다.
                 카드처럼 늘리면 첫 번째 필드의 높이가 24px 커져 이후 섹션 전체가 밀린다. */}
              <div className="flex flex-wrap gap-3">
                {businessTypes.map((type) => (
                  <Radio
                    key={type}
                    name="business"
                    value={type}
                    checked={business === type}
                    onChange={() => setBusiness(type)}
                    aria-invalid={invalid("business")}
                    aria-describedby={describedBy("business")}
                    className={
                      errors.business ? "[&_[aria-hidden]]:border-border-accent-warning h-7" : "h-7"
                    }
                  >
                    {type}
                  </Radio>
                ))}
              </div>
              {fieldError("business")}
            </fieldset>
            <div>
              <label className="block space-y-2">
                <span className="text-title-s block">프로젝트 제목</span>
                <Input
                  data-field="title"
                  size="md"
                  shape="compact"
                  className="[&_input]:text-body-s"
                  value={title}
                  maxLength={onSave ? 40 : undefined}
                  error={Boolean(errors.title)}
                  aria-describedby={describedBy("title")}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="프로젝트 제목을 입력해주세요"
                />
              </label>
              {fieldError("title")}
            </div>
            <fieldset>
              <legend className="text-title-s mb-2">카테고리</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Dropdown
                  data-field="category"
                  size="lg"
                  className={
                    errors.category
                      ? "[&_button]:!text-body-s [&_button]:!border-border-accent-warning"
                      : "[&_button]:!text-body-s"
                  }
                  aria-invalid={invalid("category")}
                  aria-describedby={describedBy("category")}
                  aria-label="대분류"
                  options={mainCategories.map((name) => ({ value: name, label: name }))}
                  value={category}
                  placeholder="대분류를 선택하세요"
                  onValueChange={(value) => {
                    setCategory(value);
                    setSubcategory("");
                    setFormMessage("");
                  }}
                />
                <Dropdown
                  data-field="subcategory"
                  size="lg"
                  className={
                    errors.subcategory
                      ? "[&_button]:!text-body-s [&_button]:!border-border-accent-warning"
                      : "[&_button]:!text-body-s"
                  }
                  aria-invalid={invalid("subcategory")}
                  aria-describedby={describedBy("subcategory")}
                  aria-label="상세 카테고리"
                  disabled={!category}
                  options={subcategoryOptions}
                  value={subcategory}
                  placeholder="상세 카테고리를 선택하세요"
                  onValueChange={(value) => {
                    setSubcategory(value);
                    setFormMessage("");
                  }}
                />
              </div>
              {fieldError("category") || fieldError("subcategory")}
            </fieldset>
            <div>
              <label className="text-title-s" htmlFor="amount">
                목표 금액
              </label>
              <p className="text-caption-s text-text-default mt-1" id="amount-hint">
                펀딩금은 선결제되며, 목표 금액을 달성하지 못할 경우 결제 금액이 자동으로 환불됩니다
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Input
                  id="amount"
                  data-field="amount"
                  error={Boolean(errors.amount)}
                  aria-describedby={errors.amount ? "amount-hint amount-error" : "amount-hint"}
                  size="md"
                  shape="compact"
                  className="[&_input]:text-body-s [&_input]:text-right"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) =>
                    /^\d*$/.test(event.target.value) && setAmount(event.target.value)
                  }
                  placeholder="금액은 최소 500,000원부터 입력 가능합니다"
                  endAdornment={<span className="text-body-s">원</span>}
                />
                <TextButton
                  variant="underline"
                  showIcon={false}
                  className="h-10 w-[68px] justify-center"
                  onClick={() => {
                    setAmount("");
                    setFormMessage("");
                  }}
                >
                  지우기 <Icon name="resetAmount" className="size-3.5" />
                </TextButton>
              </div>
              {fieldError("amount")}
              <div className="mt-2 flex flex-wrap gap-2">
                {amountSteps.map((step) => (
                  <Chip
                    key={step}
                    appearance="outline"
                    size="md"
                    onClick={() => {
                      setAmount((value) => addAmount(value, step));
                      setFormMessage("");
                    }}
                  >
                    +{step.toLocaleString("ko-KR")}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
          {apiProjectId ? (
            <ProjectRewardManager
              projectId={apiProjectId}
              error={errors.rewards}
              onCountChange={setServerRewardCount}
            />
          ) : (
            <section className="mt-[45px]" aria-labelledby="rewards" data-field="rewards">
              <h2 id="rewards" className="text-title-s text-text-title">
                리워드
              </h2>
              <p className="text-caption-s text-text-default mt-1">
                후원자에게 제공할 리워드를 등록해주세요. 최소 1개 이상 등록해야 다음 단계로 진행할
                수 있어요
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
                                {reward.registered || reward.pending ? (
                                  <span className="text-caption-s text-text-secondary px-2">
                                    {reward.registered ? "등록 완료" : "결과 확인 중"}
                                  </span>
                                ) : (
                                  <>
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
                                      onClick={() => {
                                        setRewards((current) =>
                                          current.filter((item) => item.id !== reward.id),
                                        );
                                        setFormMessage("");
                                      }}
                                      aria-label={`${reward.name} 삭제`}
                                    >
                                      삭제
                                    </TextButton>
                                  </>
                                )}
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
                <div
                  className={[
                    "bg-layer-bg border-w-xs mt-2 flex h-[238px] flex-col items-center justify-center rounded-sm border border-dashed",
                    errors.rewards ? "border-border-accent-warning" : "border-border-default",
                  ].join(" ")}
                >
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
                    aria-describedby={describedBy("rewards")}
                    onClick={() => openReward()}
                  >
                    리워드 추가
                  </Button>
                </div>
              )}
              {fieldError("rewards")}
            </section>
          )}
        </fieldset>
        {/* 리워드 영역 끝(961)부터 Figma 하단 액션 시작점(994)까지 33px */}
        <div className="mx-auto mt-[34px] w-full max-w-198 pb-7">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              appearance="cta"
              size="lg"
              className="w-[186px]"
              disabled={saving}
              onClick={() => {
                if (onSave) {
                  void saveBasicInfo(true);
                  return;
                }
                setFormMessageRole("status");
                setFormMessage("목업 임시저장입니다. 새로고침하면 입력이 초기화됩니다.");
              }}
            >
              임시저장
            </Button>
            <Button
              type="submit"
              appearance="cta"
              size="lg"
              className="w-[186px]"
              disabled={saving}
            >
              저장
            </Button>
          </div>
          {formMessage && (
            <p role={formMessageRole} className="text-caption-s text-text-secondary mt-3">
              {formMessage}
            </p>
          )}
        </div>
      </form>
      <RewardFormModal
        draft={draft}
        editing={editing !== null && editing !== "new"}
        error={rewardMessage}
        onClose={closeReward}
        onSave={saveReward}
        canSave={draft ? !rewardSaveError(draft) : false}
        onUpdate={updateDraft}
        onFile={(file) => {
          if (file)
            try {
              validateProjectMedia(file, "image");
            } catch (error) {
              /* 프로젝트가 만들어진 뒤에 거절되지 않도록 고르는 순간 형식·용량을 확인한다. */
              updateDraft({ imageName: "" });
              rewardFile.current = undefined;
              return setRewardMessage(error instanceof Error ? error.message : "");
            }
          rewardFile.current = file;
        }}
      />
    </>
  );
}
