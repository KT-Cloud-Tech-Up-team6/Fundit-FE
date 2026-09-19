"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button, secondaryButtonClasses } from "@/shared/components/ui/button";
import { DialogBase } from "@/shared/components/ui/dialog-base";
import { Icon } from "@/shared/components/ui/icon";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  addCancelPhotos,
  calculateRefund,
  cancelDetailMaxLength,
  cancelReasons,
  canSubmitCancel,
  removeCancelPhoto,
  returnReasonsByType,
  returnShippingFee,
  returnTypes,
  type CancelPhoto,
  type ReturnType,
} from "../model/funding-cancel";
import { demoFundingDetail, formatWon } from "../model/funding-history";

/* ponytail: 참여 취소·반품/교환 제출 API가 없어(docs/OPEN_DECISIONS.md P0 환불) 확인 모달에서
   버튼을 누르면 목록으로 돌아가는 것으로 갈음한다. API가 생기면 여기서 서버에 제출한다. */

export function FundingCancel({
  fundingId,
  variant = "cancel",
  initialReturnType = "",
  initialReason = "",
}: {
  fundingId: string;
  variant?: "cancel" | "return";
  initialReturnType?: ReturnType | "";
  initialReason?: string;
}) {
  const router = useRouter();
  const titleId = useId();
  const isReturn = variant === "return";
  const detail = demoFundingDetail(fundingId);
  const refund = calculateRefund(detail.amount, isReturn ? returnShippingFee : 0);

  const [returnType, setReturnType] = useState<ReturnType | "">(initialReturnType);
  const [reason, setReason] = useState(initialReason);
  const [detailText, setDetailText] = useState("");
  const [photos, setPhotos] = useState<CancelPhoto[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<CancelPhoto[]>([]);

  const canSubmit = canSubmitCancel(reason);
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
    const incoming: CancelPhoto[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      name: file.name,
    }));
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
    router.push("/my/fundings");
  }

  return (
    <div className="bg-layer-bg mx-auto flex min-h-dvh w-full max-w-[390px] min-w-0 flex-col">
      <header className="bg-layer-surface-default flex h-[52px] items-center gap-1 px-3">
        <Link
          href={`/my/fundings/${fundingId}`}
          aria-label="뒤로"
          className="flex size-10 shrink-0 items-center justify-center"
        >
          <Icon name="arrowLeft" className="text-text-default size-5" />
        </Link>
        <h1 className="text-title-s text-text-default flex-1 text-center">
          {isReturn ? "펀딩 반품/교환" : "펀딩 취소"}
        </h1>
        <Link
          href="/my/notifications"
          aria-label="알림"
          className="flex size-10 shrink-0 items-center justify-center"
        >
          <Icon name="bell" className="text-text-default size-6" />
        </Link>
      </header>

      <div className="flex flex-1 flex-col gap-2">
        <section className="bg-layer-surface-default flex gap-3 px-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={detail.imageSrc} alt="" className="size-20 shrink-0 rounded-xs object-cover" />
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-body-m text-text-default truncate">{detail.projectTitle}</p>
              <p className="text-caption-m text-text-default flex gap-1">
                <span className="truncate">{detail.rewardOption}</span>
                <span aria-hidden>·</span>
                <span className="shrink-0">{detail.rewardQuantity}개</span>
              </p>
            </div>
            <p className="text-title-s text-text-default text-right">{formatWon(detail.amount)}</p>
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
              <h2 className="text-title-s text-text-default">사진 첨부 (선택)</h2>
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
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </div>
            </div>
          )}
        </section>

        <section className="bg-layer-surface-default flex flex-col gap-3 px-5 py-4">
          <h2 className="text-title-s text-text-default">환불 정보</h2>
          <dl className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <dt className="text-body-m text-text-default">적립금 환불 금액</dt>
              <dd className="text-body-strong text-text-default flex-1 text-right">
                {formatWon(refund.pointRefundAmount)}
              </dd>
            </div>
            {isReturn && (
              <div className="flex items-center gap-2">
                <dt className="text-body-m text-text-default">배송비</dt>
                <dd className="text-body-strong text-text-default flex-1 text-right">
                  -{formatWon(refund.shippingFee)}
                </dd>
              </div>
            )}
            <div className="flex items-center gap-2">
              <dt className="text-body-m text-text-default">취소 수수료</dt>
              <dd className="text-body-strong text-text-default flex-1 text-right">
                -{formatWon(refund.cancelFee)}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-body-m text-text-default">실 환불 금액</dt>
              <dd className="text-body-strong text-text-default flex-1 text-right">
                {formatWon(refund.actualRefundAmount)}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="bg-layer-surface-default px-5 py-2">
        <Button
          className="w-full"
          appearance="cta"
          disabled={!canSubmit}
          onClick={() => setConfirmOpen(true)}
        >
          {requestLabel}
        </Button>
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
    </div>
  );
}
