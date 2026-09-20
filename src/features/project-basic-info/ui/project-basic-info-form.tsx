"use client";

import { useRef, useState } from "react";
import { ApiError } from "@/shared/api/api-error";
import { mainCategories, subcategoriesByMain } from "@/entities/category/model/project-categories";
import { Breadcrumb } from "@/shared/components/ui/breadcrumb";
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
  basicInfoError,
  businessTypes,
  demoRewards,
  discountedPrice,
  emptyReward,
  rewardError,
  upsertReward,
  type DemoReward,
  type RewardDraft,
} from "../model/basic-info-demo";
import { RewardFormModal } from "./reward-form-modal";
import { basicInfoApiError, type BasicInfoValues } from "../model/basic-info-request";
import { ProjectCreationUncertainError } from "../model/project-create-attempt";

export type BasicInfoPreview = "empty" | "adding" | "list" | "list-adding";
const breadcrumb = ["내 프로젝트", "신규 생성하기", "기본 정보 등록"];

export function ProjectBasicInfoForm({
  initialView = "empty",
  initialValues,
  onSave,
}: {
  initialView?: BasicInfoPreview;
  initialValues?: Partial<BasicInfoValues>;
  onSave?: (values: BasicInfoValues) => Promise<void>;
}) {
  const [business, setBusiness] = useState(initialValues?.business ?? "");
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [subcategory, setSubcategory] = useState(initialValues?.subcategory ?? "");
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
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
  const subcategoryOptions = category ? (subcategoriesByMain[category] ?? []) : [];
  const values = { business, title, category, subcategory, amount };
  const validation = onSave
    ? basicInfoApiError(values, false)
    : basicInfoError({ ...values, rewards });

  function updateDraft(patch: Partial<RewardDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setRewardMessage("");
  }
  function openReward(reward?: DemoReward) {
    setEditing(reward ?? "new");
    setDraft(reward ? { ...reward } : emptyReward());
    setRewardMessage("");
  }
  function closeReward() {
    setEditing(null);
    setDraft(null);
    setRewardMessage("");
  }
  function saveReward() {
    if (!draft) return;
    const error = rewardError(draft);
    if (error) return setRewardMessage(error);
    const id = editing === "new" ? nextId.current++ : editing?.id;
    if (id === undefined) return;
    setRewards((current) => upsertReward(current, draft, id));
    setFormMessage("");
    closeReward();
  }
  async function saveBasicInfo(partial = false) {
    if (savingRef.current) return;
    const error = onSave ? basicInfoApiError(values, partial) : validation;
    if (error) {
      setFormMessageRole("alert");
      return setFormMessage(error);
    }
    if (onSave) {
      savingRef.current = true;
      setSaving(true);
      try {
        await onSave(values);
        setFormMessageRole("status");
        setFormMessage("기본 정보를 저장했습니다. 리워드는 이번 저장에 포함되지 않습니다.");
      } catch (error) {
        setFormMessageRole("alert");
        setFormMessage(
          error instanceof ProjectCreationUncertainError
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
        className="flex min-h-[calc(100vh-92px)] flex-col pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          void saveBasicInfo();
        }}
        onChange={() => setFormMessage("")}
      >
        <fieldset disabled={saving} className="mx-auto w-full max-w-198 min-w-0">
          <Breadcrumb items={breadcrumb} />
          {/* breadcrumb 24 + 간격 4 + 제목(상하 8 포함) 52 = Figma page_header 80px */}
          <h1 className="text-heading-l text-text-title mt-1 w-full py-2">기본 정보 등록</h1>
          <div className="mt-3 space-y-6">
            <fieldset>
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
                    className="h-7"
                  >
                    {type}
                  </Radio>
                ))}
              </div>
            </fieldset>
            <label className="block space-y-2">
              <span className="text-title-s block">프로젝트 제목</span>
              <Input
                size="md"
                shape="compact"
                className="[&_input]:text-body-s"
                value={title}
                maxLength={onSave ? 40 : undefined}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="프로젝트 제목을 입력해주세요"
              />
            </label>
            <fieldset>
              <legend className="text-title-s mb-2">카테고리</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Dropdown
                  size="lg"
                  className="[&_button]:!text-body-s"
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
                  size="lg"
                  className="[&_button]:!text-body-s"
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
                  aria-describedby="amount-hint"
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
              disabled={saving || Boolean(validation)}
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
        onUpdate={updateDraft}
      />
    </>
  );
}
