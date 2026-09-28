"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { Button } from "@/shared/components/ui/button";
import { DialogBase } from "@/shared/components/ui/dialog-base";
import { Dropdown } from "@/shared/components/ui/dropdown";
import { Icon } from "@/shared/components/ui/icon";
import { Textarea } from "@/shared/components/ui/textarea";
import type { OrderCancelBody } from "@/entities/order/api/order-api";
import {
  RefundEvidenceValidationError,
  validateRefundEvidence,
  type RefundEstimate,
} from "@/entities/refund/api/refund-request-api";
import {
  acceptsDetailInput,
  addCancelPhotos,
  cancelDetailMaxLength,
  cancelReasons,
  cancelRequestBody,
  canSubmitCancel,
  isCancelDetailRequired,
  refundInfoFor,
  refundReasons,
  removeCancelPhoto,
  requiresEvidence,
  returnRequestTargetFor,
  returnTypes,
  shippingDelayCancelReason,
  type CancelPhoto,
  type CancelReason,
  type FundingCancelDetail,
  type FundingCancelVariant,
  type RefundInfoTarget,
  type RefundReason,
  type ReturnRequestTarget,
  type ReturnType,
} from "../model/funding-cancel";
import { formatWon } from "../model/funding-history";

export type FundingCancelSubmit =
  | { kind: "cancel"; body: OrderCancelBody }
  | { kind: "shipping-delay" }
  | { kind: "return-request"; target: ReturnRequestTarget; reasonDetail: string; files: File[] };

const toOptions = (values: readonly string[]) => values.map((value) => ({ value, label: value }));
const cancelReasonOptions = toOptions(cancelReasons);
const returnTypeOptions = toOptions(returnTypes);
const refundReasonOptions = toOptions(refundReasons);

/* 확인 모달. 취소는 CL_9(2323:55363), 반품은 2323:53647 원문이다. 교환 모달은 Figma에 없어
   반품과 같은 형식으로 문구만 바꿨다(docs/OPEN_DECISIONS.md). */
const confirmCopy = {
  cancel: {
    title: "펀딩을 취소할까요?",
    description: "취소 신청 시 결제 금액이 환불됩니다",
    action: "취소 신청",
  },
  반품: {
    title: "리워드를 반품할까요?",
    description: "신청 내용을 확인한 후 반품이 진행됩니다",
    action: "반품 신청",
  },
  교환: {
    title: "리워드를 교환할까요?",
    description: "신청 내용을 확인한 후 교환이 진행됩니다",
    action: "교환 신청",
  },
};

export function FundingCancel({
  fundingId,
  variant = "cancel",
  detail,
  estimate,
  onTargetChange,
  onSubmit,
  pending = false,
  submitError = "",
}: {
  fundingId: string;
  variant?: FundingCancelVariant;
  detail: FundingCancelDetail;
  /** 지금 고른 유형·사유의 서버 예상 금액. 없으면(조회 중·실패·결제 전 주문) 금액 영역을 숨긴다. */
  estimate: RefundEstimate | null;
  /** 반품/교환의 유형·사유가 바뀔 때마다 알린다. 호출부가 이 값으로 예상 금액을 다시 조회한다. */
  onTargetChange?: (target: ReturnRequestTarget | null) => void;
  onSubmit: (input: FundingCancelSubmit) => void;
  pending?: boolean;
  submitError?: string;
}) {
  const titleId = useId();
  const isReturn = variant === "return";
  const title = isReturn ? "리워드 반품/교환" : "펀딩 취소";

  const [cancelReason, setCancelReason] = useState<CancelReason | "">("");
  const [returnType, setReturnType] = useState<ReturnType | "">("");
  const [refundReason, setRefundReason] = useState<RefundReason | "">("");
  const [detailText, setDetailText] = useState("");
  const [photos, setPhotos] = useState<CancelPhoto[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<CancelPhoto[]>([]);

  const target =
    returnType && refundReason ? returnRequestTargetFor(returnType, refundReason) : null;
  const needsEvidence = requiresEvidence(target);
  const showsDetailInput = acceptsDetailInput(variant);
  const detailRequired = variant === "cancel" && isCancelDetailRequired(cancelReason);
  const ready =
    variant === "shipping-delay" ||
    (variant === "cancel"
      ? canSubmitCancel(cancelReason, detailText)
      : target !== null && (!needsEvidence || photos.length > 0));
  const canSubmit = ready && !pending;

  /* 취소는 사유를 고른 뒤(CL_3), 발송 지연 취소는 처음부터(CL_1-1), 반품/교환은 유형·사유를 모두
     고른 뒤(CL_6·CL_8) 금액 영역을 보여 준다. */
  const infoTarget: RefundInfoTarget | null = isReturn
    ? target
    : variant === "shipping-delay" || cancelReason
      ? { kind: "cancel" }
      : null;
  const refundInfo = infoTarget && estimate ? refundInfoFor(infoTarget, estimate) : null;

  const copy = isReturn ? (returnType ? confirmCopy[returnType] : null) : confirmCopy.cancel;
  const requestLabel = copy?.action ?? "신청";

  useEffect(
    () => () => {
      for (const photo of photosRef.current) URL.revokeObjectURL(photo.url);
    },
    [],
  );

  function selectReturn(nextType: ReturnType | "", nextReason: RefundReason | "") {
    setReturnType(nextType);
    setRefundReason(nextReason);
    onTargetChange?.(nextType && nextReason ? returnRequestTargetFor(nextType, nextReason) : null);
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPhotoError("");
    const incoming: CancelPhoto[] = [];
    for (const file of Array.from(files)) {
      try {
        validateRefundEvidence(file);
      } catch (error) {
        if (error instanceof RefundEvidenceValidationError) {
          setPhotoError(error.message);
          continue;
        }
        throw error;
      }
      incoming.push({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        name: file.name,
        file,
      });
    }
    const next = addCancelPhotos(photosRef.current, incoming);
    const acceptedIds = new Set(next.map((photo) => photo.id));
    for (const photo of incoming) {
      if (!acceptedIds.has(photo.id)) URL.revokeObjectURL(photo.url);
    }
    photosRef.current = next;
    setPhotos(next);
  }

  function handleRemovePhoto(id: string) {
    const removed = photosRef.current.find((photo) => photo.id === id);
    if (removed) URL.revokeObjectURL(removed.url);
    const next = removeCancelPhoto(photosRef.current, id);
    photosRef.current = next;
    setPhotos(next);
  }

  function handleConfirmSubmit() {
    setConfirmOpen(false);
    if (variant === "shipping-delay") {
      onSubmit({ kind: "shipping-delay" });
    } else if (variant === "cancel") {
      if (cancelReason)
        onSubmit({ kind: "cancel", body: cancelRequestBody(cancelReason, detailText) });
    } else if (target) {
      onSubmit({
        kind: "return-request",
        target,
        reasonDetail: detailText.trim(),
        files: photos.map((photo) => photo.file),
      });
    }
  }

  return (
    <BuyerAccountScreen
      title={title}
      backHref={`/my/fundings/${fundingId}`}
      backLabel="펀딩 상세로 돌아가기"
      breadcrumb={["마이페이지", "펀딩내역", title]}
      className="flex min-w-0 flex-col"
    >
      {/* 2026-09-25 개정: 배경 surface_default, 영역 사이 gap 0, 금액 영역 위 구분선. */}
      <div className="flex flex-1 flex-col min-[1200px]:pb-16">
        <div className="flex flex-1 flex-col">
          <section className="flex gap-3 px-5 py-4">
            {detail.imageSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={detail.imageSrc}
                alt=""
                className="size-20 shrink-0 rounded-xs object-cover"
              />
            ) : (
              /* 썸네일이 없으면 자리만 유지한다. */
              <div className="bg-layer-bg size-20 shrink-0 rounded-xs" />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-body-emphasis text-text-default truncate">
                  {detail.projectTitle || " "}
                </p>
                <p className="text-caption-m text-text-default flex gap-1">
                  <span className="truncate">{detail.rewardOption || " "}</span>
                  {detail.rewardQuantity !== null && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="shrink-0">{detail.rewardQuantity}개</span>
                    </>
                  )}
                </p>
              </div>
              <p className="text-title-s text-text-default">
                {detail.amount === null ? " " : formatWon(detail.amount)}
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-4 px-5 py-4">
            <div className={`flex flex-col ${variant === "shipping-delay" ? "gap-2" : "gap-4"}`}>
              <h2 className="text-title-s text-text-default">{isReturn ? "사유" : "취소 사유"}</h2>
              {variant === "shipping-delay" ? (
                <p className="text-body-emphasis text-text-default">{shippingDelayCancelReason}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {isReturn ? (
                    <div className="flex w-full gap-2">
                      <Dropdown
                        aria-label="유형"
                        className="w-[88px] shrink-0"
                        placeholder="유형"
                        options={returnTypeOptions}
                        value={returnType}
                        onValueChange={(value) => selectReturn(value as ReturnType, refundReason)}
                      />
                      <Dropdown
                        aria-label="사유"
                        className="flex-1"
                        placeholder="사유를 선택해주세요"
                        options={refundReasonOptions}
                        value={refundReason}
                        onValueChange={(value) => selectReturn(returnType, value as RefundReason)}
                      />
                    </div>
                  ) : (
                    <Dropdown
                      aria-label="취소 사유"
                      placeholder="취소 사유를 선택해주세요"
                      options={cancelReasonOptions}
                      value={cancelReason}
                      onValueChange={(value) => setCancelReason(value as CancelReason)}
                    />
                  )}
                  {showsDetailInput && (
                    <Textarea
                      aria-label="상세 내용"
                      className="h-[222px]"
                      placeholder={`내용을 입력해주세요 (${detailRequired ? "필수" : "선택"})`}
                      maxLength={cancelDetailMaxLength}
                      value={detailText}
                      onChange={(event) => setDetailText(event.target.value)}
                    />
                  )}
                </div>
              )}
            </div>

            {isReturn && (
              <div className="flex flex-col gap-3">
                <h2 className="text-title-s text-text-default">
                  사진 첨부 {needsEvidence ? "(필수)" : "(선택)"}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative size-20 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- objectURL이라 next/image 최적화 대상이 아니다. */}
                      <img src={photo.url} alt="" className="size-full rounded-xs object-cover" />
                      <button
                        type="button"
                        aria-label={`${photo.name} 첨부 삭제`}
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="bg-layer-surface-primary text-text-inverse absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full"
                      >
                        <Icon name="closeSmall" className="size-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    aria-label="사진 첨부"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-border-default flex size-20 items-center justify-center rounded-xs border border-dashed"
                  >
                    <Icon name="plusSquare" className="text-text-secondary size-6" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      handleFiles(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </div>
                {needsEvidence && (
                  <p className="text-caption-s text-text-info">
                    상품 상태를 확인할 수 있는 사진을 1장 이상 첨부해주세요.
                  </p>
                )}
                {photoError && (
                  <p role="alert" className="text-caption-m text-text-secondary">
                    {photoError}
                  </p>
                )}
              </div>
            )}
          </section>

          {refundInfo && (
            <section className="border-border-default flex flex-col gap-4 border-t px-5 py-4">
              <h2 className="text-title-s text-text-default">{refundInfo.title}</h2>
              <dl className="flex flex-col gap-3">
                {refundInfo.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-2">
                    <dt className="text-body-s text-text-secondary font-medium">{row.label}</dt>
                    <dd className="text-title-s text-text-default text-right">{row.value}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-body-emphasis text-text-default">{refundInfo.total.label}</dt>
                  <dd className="text-title-s text-text-default text-right">
                    {refundInfo.total.value}
                  </dd>
                </div>
              </dl>
              {refundInfo.notice && (
                <p className="border-border-default text-caption-s text-text-info border-t py-3">
                  {refundInfo.notice}
                </p>
              )}
            </section>
          )}

          {submitError && (
            <p role="alert" className="text-body-s text-text-default px-5 py-2">
              {submitError}
            </p>
          )}
        </div>

        <div className="px-5 py-2 min-[1200px]:mx-auto min-[1200px]:flex min-[1200px]:w-[386px] min-[1200px]:gap-2 min-[1200px]:px-0 min-[1200px]:py-5">
          {/* Button 기본 클래스의 inline-flex가 hidden보다 뒤에 오므로 래퍼로 숨긴다. */}
          <div className="hidden min-[1200px]:flex min-[1200px]:flex-1">
            <Button
              href={`/my/fundings/${fundingId}`}
              variant="secondary"
              appearance="cta"
              size="lg"
              className="w-full"
            >
              돌아가기
            </Button>
          </div>
          <Button
            className="w-full min-[1200px]:w-auto min-[1200px]:flex-1"
            appearance="cta"
            size="lg"
            disabled={!canSubmit}
            onClick={() => setConfirmOpen(true)}
          >
            {pending ? "신청 중" : requestLabel}
          </Button>
        </div>
      </div>

      <DialogBase
        open={confirmOpen && copy !== null}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby={titleId}
        className="bg-layer-surface-default backdrop:bg-layer-overlay m-auto w-[350px] max-w-[calc(100vw-40px)] rounded-xs p-6"
      >
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <p id={titleId} className="text-title-s text-text-default text-center">
              {copy?.title}
            </p>
            <p className="text-body-m text-text-default text-center">{copy?.description}</p>
          </div>
          <div className="flex w-full gap-3">
            <Button
              className="flex-1"
              variant="secondary"
              appearance="cta"
              onClick={() => setConfirmOpen(false)}
            >
              닫기
            </Button>
            <Button className="flex-1" appearance="cta" onClick={handleConfirmSubmit}>
              {requestLabel}
            </Button>
          </div>
        </div>
      </DialogBase>
    </BuyerAccountScreen>
  );
}
