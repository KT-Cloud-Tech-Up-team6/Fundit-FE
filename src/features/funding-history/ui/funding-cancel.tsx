"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { Button, secondaryButtonClasses } from "@/shared/components/ui/button";
import { DialogBase } from "@/shared/components/ui/dialog-base";
import { Icon } from "@/shared/components/ui/icon";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  RefundEvidenceValidationError,
  validateRefundEvidence,
} from "@/entities/refund/api/refund-request-api";
import {
  addCancelPhotos,
  cancelDetailMaxLength,
  cancelReasons,
  canSubmitCancel,
  refundSubmissionFor,
  removeCancelPhoto,
  returnReasonsByType,
  returnTypes,
  type CancelPhoto,
  type RefundInfo,
  type RefundSubmission,
  type ReturnType,
} from "../model/funding-cancel";
import { formatWon } from "../model/funding-history";

/** 신청 화면 상단(1165:16087)이 보여주는 주문 정보. 채우지 못하는 값은 빈 문자열로 둔다. */
export type FundingCancelDetail = {
  imageSrc: string;
  projectTitle: string;
  rewardOption: string;
  rewardQuantity: number | null;
  amount: number | null;
};

export type FundingCancelSubmit = {
  submission: RefundSubmission;
  /** 선택한 사유 라벨. 교환은 BE enum이 없어 이 라벨을 reasonDetail에 담는다. */
  reason: string;
  reasonDetail: string;
  files: File[];
};

const amountText = (value: number | null) => (value === null ? "" : formatWon(value));

export function FundingCancel({
  fundingId,
  variant = "cancel",
  initialReturnType = "",
  initialReason = "",
  detail,
  refund,
  onSubmit,
  pending = false,
  submitError = "",
}: {
  fundingId: string;
  variant?: "cancel" | "return";
  initialReturnType?: ReturnType | "";
  initialReason?: string;
  detail: FundingCancelDetail;
  refund: RefundInfo;
  onSubmit: (input: FundingCancelSubmit) => void;
  pending?: boolean;
  submitError?: string;
}) {
  const titleId = useId();
  const isReturn = variant === "return";

  const [returnType, setReturnType] = useState<ReturnType | "">(initialReturnType);
  const [reason, setReason] = useState(initialReason);
  const [detailText, setDetailText] = useState("");
  const [photos, setPhotos] = useState<CancelPhoto[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<CancelPhoto[]>([]);

  const submission = isReturn ? refundSubmissionFor(returnType, reason) : null;
  /* 하자 환불·교환은 evidenceUrls가 필수라(DefectRefundRequestV2·ExchangeRequestV2) 사진 없이
     보내면 400이 된다. 원본은 "(선택)"으로 그려져 있어 디자인 확인이 필요하다(docs/OPEN_DECISIONS.md). */
  const needsEvidence =
    submission?.supported === true &&
    (submission.kind === "defect" || submission.kind === "exchange");
  /* 배송 지연·단순변심 계약은 fundingId만 받는다. 첨부·상세가 서버로 가지 않는다는 것을 알린다. */
  const unsentAttachments =
    submission?.supported === true &&
    (submission.kind === "shipping-delay" || submission.kind === "simple-change-of-mind");
  const blockedReason =
    submission !== null && !submission.supported && reason !== "" ? submission.reason : "";
  const canSubmit =
    canSubmitCancel(reason) &&
    !pending &&
    (!isReturn || (submission!.supported && (!needsEvidence || photos.length > 0)));

  const requestLabel = isReturn ? `${returnType || "반품/교환"} 신청` : "취소 신청";
  const confirmationTitle = isReturn
    ? `${returnType || "반품/교환"}을 신청할까요?`
    : "펀딩을 취소할까요?";
  const confirmationDescription = isReturn
    ? "신청 내용을 확인 후 처리해 드립니다"
    : "취소 신청 시 결제 금액이 환불됩니다";

  useEffect(
    () => () => {
      for (const photo of photosRef.current) URL.revokeObjectURL(photo.url);
    },
    [],
  );

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
    const target = photosRef.current.find((photo) => photo.id === id);
    if (target) URL.revokeObjectURL(target.url);
    const next = removeCancelPhoto(photosRef.current, id);
    photosRef.current = next;
    setPhotos(next);
  }

  function handleConfirmSubmit() {
    setConfirmOpen(false);
    onSubmit({
      submission: submission ?? { supported: false, reason: "" },
      reason,
      reasonDetail: detailText,
      files: photos.map((photo) => photo.file),
    });
  }

  return (
    <BuyerAccountScreen
      title={isReturn ? "펀딩 반품/교환" : "펀딩 취소"}
      backHref={`/my/fundings/${fundingId}`}
      backLabel="펀딩 상세로 돌아가기"
      breadcrumb={["마이페이지", "펀딩내역", isReturn ? "펀딩 반품/교환" : "펀딩 취소"]}
      className="flex min-w-0 flex-col"
    >
      <div className="bg-layer-bg min-[1200px]:bg-layer-surface-default flex flex-1 flex-col min-[1200px]:pb-16">
        <div className="flex flex-1 flex-col gap-2">
          <section className="bg-layer-surface-default flex gap-3 px-5 py-4">
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
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-body-m text-text-default truncate">
                  {detail.projectTitle || " "}
                </p>
                <p className="text-caption-m text-text-default flex gap-1">
                  <span className="truncate">{detail.rewardOption || " "}</span>
                  {detail.rewardQuantity !== null && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="shrink-0">{detail.rewardQuantity}개</span>
                    </>
                  )}
                </p>
              </div>
              <p className="text-title-s text-text-default text-right">
                {amountText(detail.amount) || " "}
              </p>
            </div>
          </section>

          <section className="bg-layer-surface-default flex flex-col gap-4 px-5 py-4">
            <div className="flex flex-col gap-4">
              <h2 className="text-title-s text-text-default">{isReturn ? "사유" : "취소 사유"}</h2>
              <div className="flex flex-col gap-2">
                {isReturn && (
                  <div className="flex w-full gap-2">
                    <Select
                      aria-label="유형"
                      className="!w-[88px] shrink-0"
                      value={returnType}
                      onChange={(event) => {
                        setReturnType(event.target.value as ReturnType);
                        setReason("");
                      }}
                    >
                      <option value="" disabled hidden>
                        유형 선택
                      </option>
                      {returnTypes.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </Select>
                    <Select
                      aria-label="사유"
                      className="!w-auto min-w-0 flex-1"
                      value={reason}
                      disabled={!returnType}
                      onChange={(event) => setReason(event.target.value)}
                    >
                      <option value="" disabled hidden>
                        사유를 선택해주세요
                      </option>
                      {returnReasonsByType[returnType || "반품"].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
                {!isReturn && (
                  <Select
                    aria-label="취소 사유"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  >
                    <option value="" disabled hidden>
                      취소 사유를 선택해주세요
                    </option>
                    {cancelReasons.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                )}
                {blockedReason && (
                  <p role="status" className="text-caption-m text-text-secondary">
                    {blockedReason}
                  </p>
                )}
                <Textarea
                  className="h-[222px]"
                  placeholder="내용을 입력해주세요 (선택)"
                  maxLength={cancelDetailMaxLength}
                  value={detailText}
                  onChange={(event) => setDetailText(event.target.value)}
                />
              </div>
            </div>

            {isReturn && (
              <div className="flex flex-col gap-3">
                <h2 className="text-title-s text-text-default">
                  사진 첨부 {needsEvidence ? "(필수)" : "(선택)"}
                </h2>
                {unsentAttachments && (
                  <p role="status" className="text-caption-m text-text-secondary">
                    {reason} 접수에는 사진과 상세 내용이 함께 전달되지 않습니다.
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-label="사진 첨부"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-text-secondary flex size-20 items-center justify-center rounded-xs border border-dashed"
                  >
                    <Icon name="plusSquare" className="text-text-secondary size-3.5" />
                  </button>
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative size-20 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- objectURL이라 next/image 최적화 대상이 아니다. */}
                      <img
                        src={photo.url}
                        alt=""
                        className="border-border-default size-full rounded-xs border object-cover"
                      />
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
                {photoError && (
                  <p role="alert" className="text-caption-m text-text-secondary">
                    {photoError}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="bg-layer-surface-default flex flex-col gap-3 px-5 py-4">
            <h2 className="text-title-s text-text-default">환불 정보</h2>
            <dl className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <dt className="text-body-m text-text-default">적립금 환불 금액</dt>
                <dd className="text-body-strong text-text-default flex-1 text-right">
                  {amountText(refund.pointRefundAmount) || " "}
                </dd>
              </div>
              {isReturn && (
                <div className="flex items-center gap-2">
                  <dt className="text-body-m text-text-default">배송비</dt>
                  <dd className="text-body-strong text-text-default flex-1 text-right">
                    {refund.shippingFee === null ? " " : `-${formatWon(refund.shippingFee)}`}
                  </dd>
                </div>
              )}
              <div className="flex items-center gap-2">
                <dt className="text-body-m text-text-default">취소 수수료</dt>
                <dd className="text-body-strong text-text-default flex-1 text-right">
                  {refund.cancelFee === null ? " " : `-${formatWon(refund.cancelFee)}`}
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="text-body-m text-text-default">실 환불 금액</dt>
                <dd className="text-body-strong text-text-default flex-1 text-right">
                  {amountText(refund.actualRefundAmount) || " "}
                </dd>
              </div>
            </dl>
          </section>

          {submitError && (
            <p role="alert" className="text-body-s text-text-default px-5">
              {submitError}
            </p>
          )}
        </div>

        <div className="bg-layer-surface-default px-5 py-2 min-[1200px]:mx-auto min-[1200px]:flex min-[1200px]:w-[386px] min-[1200px]:gap-2 min-[1200px]:px-0 min-[1200px]:py-5">
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
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby={titleId}
        className="bg-layer-surface-default backdrop:bg-layer-overlay m-auto w-[350px] max-w-[calc(100vw-40px)] rounded-xs p-6"
      >
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <p id={titleId} className="text-title-s text-text-default text-center">
              {confirmationTitle}
            </p>
            <p className="text-body-m text-text-secondary text-center">{confirmationDescription}</p>
          </div>
          <div className="flex w-full gap-3">
            <button
              type="button"
              className={`${secondaryButtonClasses} h-[46px] flex-1`}
              onClick={() => setConfirmOpen(false)}
            >
              닫기
            </button>
            <Button className="flex-1" appearance="cta" onClick={handleConfirmSubmit}>
              {requestLabel}
            </Button>
          </div>
        </div>
      </DialogBase>
    </BuyerAccountScreen>
  );
}
