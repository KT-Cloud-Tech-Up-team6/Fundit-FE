"use client";

import { useId, useRef, useState } from "react";
import { Button, secondaryButtonClasses } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Chip } from "@/shared/components/ui/chip";
import { Icon } from "@/shared/components/ui/icon";
import { Input } from "@/shared/components/ui/input";
import { CategoryDropdown } from "./category-dropdown";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  addAmount,
  amountSteps,
  businessTypes,
  demoRewards,
  emptyReward,
  homeCategories,
  mainCategories,
  positiveInteger,
  rewardError,
  upsertReward,
  type DemoReward,
  type RewardDraft,
} from "../model/basic-info-demo";

export type BasicInfoPreview = "empty" | "adding" | "list" | "list-adding";
const inputClass = "h-11.5! rounded-xs! [&_input]:text-caption-m";

export function ProjectBasicInfoForm({
  initialView = "empty",
}: {
  initialView?: BasicInfoPreview;
}) {
  const id = useId();
  const [business, setBusiness] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [amount, setAmount] = useState("");
  const [rewards, setRewards] = useState<DemoReward[]>(() =>
    initialView.startsWith("list") ? demoRewards.map((reward) => ({ ...reward })) : [],
  );
  const [draft, setDraft] = useState<RewardDraft | null>(() =>
    initialView.includes("adding") ? emptyReward() : null,
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const nextId = useRef(3);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const rewardNameRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const noticeRef = useRef<HTMLParagraphElement>(null);

  function updateDraft(patch: Partial<RewardDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setError("");
    setNotice("");
  }

  function openReward(reward?: DemoReward) {
    setDraft(reward ? { ...reward } : emptyReward());
    setEditingId(reward?.id ?? null);
    setError("");
    setNotice("");
    requestAnimationFrame(() => rewardNameRef.current?.focus());
  }

  function closeReward() {
    setDraft(null);
    setEditingId(null);
    setError("");
    requestAnimationFrame(() => addButtonRef.current?.focus());
  }

  function save() {
    const message = draft ? rewardError(draft) : "";
    if (message) {
      setError(message);
      rewardNameRef.current?.focus();
      return;
    }
    if (draft) {
      const rewardId = editingId ?? nextId.current;
      setRewards((current) => upsertReward(current, draft, rewardId));
      if (editingId === null) nextId.current += 1;
      closeReward();
      setNotice(
        "리워드를 목업 목록에 반영했습니다. 기본 정보와 리워드는 서버에 저장되지 않습니다.",
      );
      return;
    }
    const basicError = !business
      ? "사업자 유형을 선택해주세요."
      : !title.trim()
        ? "프로젝트 제목을 입력해주세요."
        : !category
          ? "프로젝트 카테고리를 선택해주세요."
          : category === "홈 · 리빙" && !subcategory
            ? "상세 카테고리를 선택해주세요."
            : !positiveInteger(amount) || Number(amount) < 500_000
              ? "목표 금액은 최소 500,000원 이상의 정수로 입력해주세요."
              : !rewards.length
                ? "리워드를 최소 1개 등록해주세요."
                : "";
    setError(basicError);
    setNotice(
      basicError ? "" : "목업 저장입니다. 실제 프로젝트를 생성하거나 서버에 저장하지 않습니다.",
    );
    requestAnimationFrame(() => noticeRef.current?.focus());
  }

  return (
    <form
      className="flex min-h-[calc(100vh-92px)] flex-col pt-3"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      onChange={() => {
        setNotice("");
        setError("");
      }}
    >
      <div className="mx-auto w-full max-w-198">
        <p className="text-caption-strong flex flex-wrap gap-2 py-1">
          내 프로젝트 <span aria-hidden>&gt;</span> 신규 생성하기 <span aria-hidden>&gt;</span> 기본
          정보 등록
        </p>
        <h1 className="text-heading-l py-2">기본 정보 등록</h1>
        <div className="mt-3 space-y-6">
          <fieldset>
            <legend className="text-body-strong mb-2">사업자 유형</legend>
            <div className="grid grid-cols-3 gap-3">
              {businessTypes.map((type) => (
                <label key={type} className="cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name={`${id}-business`}
                    value={type}
                    checked={business === type}
                    onChange={() => setBusiness(type)}
                  />
                  <span className="border-border-default text-caption-m peer-checked:border-border-primary peer-checked:bg-layer-surface-disabled peer-focus-visible:outline-border-primary flex h-11.5 items-center justify-center rounded-xs border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block space-y-2">
            <span className="text-title-s font-medium">프로젝트 제목</span>
            <Input
              className={`${inputClass} bg-layer-surface-disabled border-transparent!`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="프로젝트 제목을 입력해주세요"
            />
          </label>
          <fieldset>
            <legend className="text-body-strong mb-2">프로젝트 카테고리</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <CategoryDropdown
                label="대분류"
                placeholder="대분류를 선택하세요"
                value={category}
                options={mainCategories}
                onChange={(value) => {
                  setCategory(value);
                  setSubcategory("");
                  setError("");
                  setNotice("");
                }}
              />
              <CategoryDropdown
                key={category}
                label="상세 카테고리"
                placeholder="상세"
                disabled={category !== "홈 · 리빙"}
                value={subcategory}
                options={homeCategories}
                onChange={(value) => {
                  setSubcategory(value);
                  setError("");
                  setNotice("");
                }}
              />
            </div>
            {category && category !== "홈 · 리빙" && (
              <p className="text-caption-s mt-2">이 대분류의 상세 목록은 연동 예정입니다.</p>
            )}
          </fieldset>
          <div>
            <label className="text-body-strong" htmlFor={`${id}-amount`}>
              목표 금액
            </label>
            <p className="text-label-s mt-1" id={`${id}-amount-hint`}>
              펀딩금은 선결제되며, 목표 금액을 달성하지 못할 경우 결제 금액이 자동으로 환불됩니다
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Input
                id={`${id}-amount`}
                aria-describedby={`${id}-amount-hint`}
                className={`${inputClass} [&_input]:text-right`}
                inputMode="numeric"
                value={amount}
                onChange={(event) => {
                  if (/^\d*$/.test(event.target.value)) setAmount(event.target.value);
                }}
                placeholder="금액은 최소 500,000원 부터 입력 가능합니다"
                endAdornment={<span className="text-caption-m">원</span>}
              />
              <button
                type="button"
                className="text-caption-strong flex h-11.5 shrink-0 items-center gap-1 px-3"
                onClick={() => {
                  setAmount("");
                  setNotice("");
                }}
              >
                <Icon name="resetAmount" className="size-3" />
                지우기
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {amountSteps.map((step) => (
                <Chip
                  key={step}
                  className="bg-layer-surface-disabled! border-border-default text-caption-s! h-6 border px-1!"
                  onClick={() => {
                    setAmount((value) => addAmount(value, step));
                    setNotice("");
                  }}
                >
                  + {step.toLocaleString("ko-KR")}
                </Chip>
              ))}
            </div>
          </div>
        </div>
        <section className="mt-11" aria-labelledby={`${id}-rewards`}>
          <h2 id={`${id}-rewards`} className="text-heading-m">
            리워드
          </h2>
          <p className="text-caption-m mt-1">
            후원자에게 제공할 리워드를 등록해주세요. 최소 1개 이상 등록해야 다음 단계로 진행할 수
            있어요
          </p>
          {rewards.length > 0 && (
            <div className="border-border-default mt-6 overflow-x-auto rounded-xs border">
              <table className="text-caption-m w-full min-w-[600px] text-left">
                <caption className="sr-only">등록된 리워드</caption>
                <thead className="bg-border-default">
                  <tr>
                    {["No.", "리워드명", "가격", "수량", "얼리버드", "관리"].map((label) => (
                      <th key={label} scope="col" className="px-4 py-2 font-medium">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((reward, index) => (
                    <tr key={reward.id}>
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="max-w-60 px-4 py-3 break-words">{reward.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {Number(reward.price).toLocaleString("ko-KR")}원
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {reward.limited ? `${reward.quantity}개` : "제한 없음"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {reward.earlyBird ? "적용" : "미적용"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={draft !== null}
                          aria-label={`${reward.name} 수정`}
                          onClick={() => openReward(reward)}
                        >
                          수정
                        </button>{" "}
                        ·{" "}
                        <button
                          type="button"
                          disabled={draft !== null}
                          aria-label={`${reward.name} 삭제`}
                          onClick={() => {
                            setRewards((current) =>
                              current.filter((item) => item.id !== reward.id),
                            );
                            setNotice("리워드를 목업 목록에서 삭제했습니다.");
                          }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!draft && (
                <button
                  ref={addButtonRef}
                  type="button"
                  className={`${secondaryButtonClasses} h-11.5 w-full gap-2`}
                  onClick={() => openReward()}
                >
                  리워드 추가하기 <Icon name="plusSquare" className="size-4" />
                </button>
              )}
            </div>
          )}
          {!rewards.length && !draft && (
            <div className="bg-layer-surface-disabled border-border-default mt-6 flex h-57.5 flex-col items-center justify-center rounded-xs border border-dashed">
              <div className="relative size-14">
                <Icon name="gift" className="absolute top-2.5 left-2.5 size-9" />
                <Icon name="plusCircle" className="absolute top-0 right-0 size-4" />
              </div>
              <p className="text-caption-m mt-2 text-center">
                등록된 리워드가 없습니다
                <br />
                리워드를 등록해주세요
              </p>
              <Button
                ref={addButtonRef}
                size="md"
                className="text-caption-m! mt-2 w-45"
                onClick={() => openReward()}
              >
                리워드 추가
              </Button>
            </div>
          )}
          {draft && (
            <div className="border-border-default mt-6 rounded-xs border p-4">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-body-strong">
                  {editingId === null ? "리워드 추가하기" : "리워드 수정하기"}
                </h3>
                <button
                  type="button"
                  aria-label="리워드 작성 취소"
                  className="flex size-6 items-center justify-center"
                  onClick={closeReward}
                >
                  <Icon name="closeSmall" className="size-4" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-caption-m">리워드 명</span>
                    <Input
                      ref={rewardNameRef}
                      className={inputClass}
                      value={draft.name}
                      onChange={(event) => updateDraft({ name: event.target.value })}
                      placeholder="리워드 이름을 입력해주세요"
                    />
                  </label>
                  <div className="space-y-2">
                    <p className="text-caption-m">이미지</p>
                    <div className="flex gap-3">
                      <Input
                        aria-label="리워드 이미지"
                        className={`${inputClass} bg-layer-surface-disabled`}
                        readOnly
                        placeholder="이미지를 첨부해주세요"
                      />
                      <button
                        type="button"
                        disabled
                        title="이미지 업로드는 연동 예정입니다."
                        className={`${secondaryButtonClasses} h-11.5 w-20 shrink-0`}
                      >
                        찾아 보기
                      </button>
                    </div>
                  </div>
                </div>
                <label className="block space-y-2">
                  <span className="text-caption-m">리워드 설명</span>
                  <Textarea
                    rows={1}
                    className="h-11.5! py-3!"
                    value={draft.description}
                    onChange={(event) => updateDraft({ description: event.target.value })}
                    placeholder="리워드에 대한 설명을 입력해주세요"
                  />
                </label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-caption-m">가격</span>
                    <Input
                      className={inputClass}
                      inputMode="numeric"
                      value={draft.price}
                      onChange={(event) => updateDraft({ price: event.target.value })}
                      placeholder="리워드 가격을 입력해주세요"
                    />
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`${id}-quantity`} className="text-caption-m">
                        수량
                      </label>
                      <Checkbox
                        shape="square"
                        checked={draft.limited}
                        onChange={(event) => updateDraft({ limited: event.target.checked })}
                        className="[&>span:last-child]:text-caption-strong flex-row-reverse"
                      >
                        수량 제한
                      </Checkbox>
                    </div>
                    <Input
                      id={`${id}-quantity`}
                      className={inputClass}
                      inputMode="numeric"
                      disabled={!draft.limited}
                      value={draft.quantity}
                      onChange={(event) => updateDraft({ quantity: event.target.value })}
                      placeholder={draft.limited ? "리워드 수량을 입력해주세요" : "제한 없음"}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Checkbox
                    shape="square"
                    checked={draft.earlyBird}
                    onChange={(event) => updateDraft({ earlyBird: event.target.checked })}
                    className="w-full items-start px-4 py-2"
                  >
                    <span className="text-body-emphasis">리워드 혜택 설정 · 얼리버드</span>
                    <span className="text-caption-m ml-2">
                      선착순 후원자에게 별도 할인 가격 · 한정 수량으로 제공해요
                    </span>
                  </Checkbox>
                  <Checkbox
                    shape="square"
                    checked={draft.options}
                    onChange={(event) => updateDraft({ options: event.target.checked })}
                    className="w-full items-start px-4 py-2"
                  >
                    <span className="text-body-emphasis">옵션 설정</span>
                    <span className="text-caption-m ml-2">
                      색상·사이즈처럼 후원자가 고를 수 있는 옵션이 있다면 켜주세요
                    </span>
                  </Checkbox>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
      <div className="mt-auto pt-16 pb-3">
        <div className="flex justify-end gap-6">
          <button
            type="button"
            className={`${secondaryButtonClasses} h-11.5 w-45`}
            onClick={() => {
              setError("");
              setNotice(
                "목업 임시저장입니다. 새로고침하면 입력이 초기화되며 서버에 저장되지 않습니다.",
              );
            }}
          >
            임시저장
          </button>
          <Button type="submit" className="w-45">
            저장
          </Button>
        </div>
        <p
          ref={noticeRef}
          tabIndex={-1}
          role={error ? "alert" : "status"}
          className="text-caption-s mt-3 min-h-5"
        >
          {error ||
            notice ||
            "목업 화면 · 입력은 현재 화면에서만 유지됩니다. 실제 생성·저장·업로드는 하지 않습니다."}
        </p>
      </div>
    </form>
  );
}
