import { apiRequest } from "../../../shared/api/client";
import { ApiError } from "../../../shared/api/api-error";

/* 조회(`refund-api.ts`)와 달리 신청·증빙은 payment-service의 다른 계약을 쓴다.
   v1 요청은 fundingId가 Long이라 컨트롤러가 order-service를 한 번 더 조회해 UUID로
   바꾼다. FE는 이미 UUID를 들고 있으므로 v2를 쓴다. */

/** BE `DefectType`. 모두 판매자 귀책이고 `OTHER`만 귀책이 불분명하다. */
export type RefundDefectType =
  | "DEFECTIVE"
  | "DAMAGED"
  | "WRONG_DELIVERY"
  | "DIFFERENT_FROM_DESCRIPTION"
  | "MISSING_COMPONENTS"
  | "OTHER";

/** BE `ReturnRequestV2.ReturnReason`. 둘 다 구매자 귀책이라 반품 배송비를 뺀다. */
export type RefundReturnReason = "CHANGE_OF_MIND" | "WRONG_OPTION";

/** BE `ExchangeReason`. 구매자 귀책 둘, 판매자 귀책 다섯, 기타(`OTHER`)로 나뉜다. */
export type RefundExchangeReason =
  | "CHANGE_OF_MIND"
  | "WRONG_OPTION"
  | "DEFECTIVE"
  | "DAMAGED"
  | "WRONG_DELIVERY"
  | "MISSING_COMPONENTS"
  | "DIFFERENT_FROM_DESCRIPTION"
  | "OTHER";

/** 신청 유형별 예상 금액 조회 조건. 아무것도 넘기지 않으면 전액 환불 기준이다. */
export type RefundEstimateParams = {
  triggerType?: "RETURN_CHANGE_OF_MIND" | "DEFECT" | "EXCHANGE";
  defectType?: RefundDefectType;
  exchangeReason?: RefundExchangeReason;
};

export type RefundEstimate = {
  orderId: string;
  paymentAmount: number;
  rewardAmount: number;
  shippingFee: number;
  discountAmount: number;
  /** 구매자 귀책 반품(`RETURN_CHANGE_OF_MIND`)에서만 0보다 크다. */
  returnShippingFee: number;
  /** 구매자 귀책 교환에서만 0보다 크다. */
  additionalPaymentAmount: number;
  /** 교환과 기타 하자(`OTHER`)는 확정액이 없어 null이다. BE는 null 필드를 JSON에서 뺀다. */
  refundAmount?: number | null;
  /** false면 판매자 검토로 금액이 바뀔 수 있다. */
  confirmed: boolean;
};

/** 서버가 계산한 예상 금액. FE가 금액을 직접 계산해 고지하지 않는다.
    결제가 완료되지 않은 주문은 404다. */
export function getRefundEstimate(
  orderId: string,
  params: RefundEstimateParams = {},
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ orderId });
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  return apiRequest<RefundEstimate>(`/api/v1/refunds/estimate?${query}`, { auth: true, signal });
}

export type RefundRequestCreated = { refundId: number; status: string };

/** 판매자 승인 대기 상태로 접수된다. 이 시점에 결제가 취소되지는 않는다.
    `evidenceUrls`는 BE에서 `@NotEmpty`라 한 장 이상 필요하다. */
export function requestDefectRefund(body: {
  fundingId: string;
  defectType: RefundDefectType;
  reasonDetail?: string;
  evidenceUrls: string[];
}) {
  return apiRequest<RefundRequestCreated>("/api/v2/refunds/defect", {
    auth: true,
    method: "POST",
    body,
  });
}

/** 발송 후 구매자 귀책 반품. 판매자가 회수를 확인하고 승인하면 반품 배송비를 뺀 금액만 환불된다.
    증빙은 선택이다. */
export function requestReturn(body: {
  fundingId: string;
  returnReason: RefundReturnReason;
  reasonDetail?: string;
  evidenceUrls: string[];
}) {
  return apiRequest<
    RefundRequestCreated & {
      paymentAmount: number;
      returnShippingFee: number;
      estimatedRefundAmount: number;
    }
  >("/api/v2/refunds/return", {
    auth: true,
    method: "POST",
    body,
  });
}

export function requestShippingDelayRefund(fundingId: string) {
  return apiRequest<RefundRequestCreated>("/api/v2/refunds/shipping-delay", {
    auth: true,
    method: "POST",
    body: { fundingId },
  });
}

/* 판매자 검토 대기(REQUESTED)로만 접수된다. 승인·교환비 결제는 이번 범위가 아니다(PM 09 Q1).
   `exchangeReason`은 BE에서 아직 선택이지만 FE 전환 뒤 필수가 되므로 항상 보낸다.
   응답의 `exchangeShippingFee`는 사유와 무관하게 5,000원이라 구매자 부담액으로 쓰지 않는다. */
export function requestExchange(body: {
  fundingId: string;
  exchangeReason: RefundExchangeReason;
  reasonDetail?: string;
  evidenceUrls: string[];
}) {
  return apiRequest<
    RefundRequestCreated & { exchangeShippingFee: number; additionalPaymentAmount: number }
  >("/api/v2/refunds/exchange", {
    auth: true,
    method: "POST",
    body,
  });
}

export class RefundEvidenceValidationError extends Error {}

/* RefundEvidenceUploadService의 허용 범위와 같다. 프로젝트 미디어 업로드와 값이 겹치지만
   서비스도 상수도 따로 관리되므로 한쪽이 바뀌어도 다른 쪽을 따라가지 않는다. */
const evidenceMaxBytes = 10 * 1024 * 1024;

export function validateRefundEvidence(file: File) {
  const allowed =
    (file.type === "image/jpeg" && /\.jpe?g$/i.test(file.name)) ||
    (file.type === "image/png" && /\.png$/i.test(file.name)) ||
    (file.type === "image/webp" && /\.webp$/i.test(file.name));
  if (!allowed) {
    throw new RefundEvidenceValidationError("증빙 사진은 JPG·PNG·WebP만 첨부할 수 있습니다.");
  }
  if (file.size <= 0 || file.size > evidenceMaxBytes) {
    throw new RefundEvidenceValidationError("증빙 사진은 10MB 이하만 첨부할 수 있습니다.");
  }
}

/** 발급받은 주소로 직접 올리고 신청에 담을 `fileUrl`을 돌려준다. 주소는 5분 뒤 만료된다. */
export async function uploadRefundEvidence(orderId: string, file: File) {
  validateRefundEvidence(file);
  let upload: { uploadUrl: string; fileUrl: string };
  try {
    upload = await apiRequest<{ uploadUrl: string; fileUrl: string }>(
      "/api/v1/refunds/evidence/upload-url",
      {
        auth: true,
        method: "POST",
        body: { orderId, fileName: file.name, contentType: file.type, fileSize: file.size },
      },
    );
  } catch (error) {
    if (error instanceof ApiError && error.code === "UNSUPPORTED_MEDIA_TYPE") {
      throw new RefundEvidenceValidationError(
        "지원하지 않는 파일 형식입니다. JPG·PNG·WebP 사진을 선택해주세요.",
      );
    }
    if (error instanceof ApiError && error.code === "MEDIA_TOO_LARGE") {
      throw new RefundEvidenceValidationError("파일 용량이 너무 큽니다. 10MB 이하로 선택해주세요.");
    }
    throw error;
  }
  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
    credentials: "omit",
  });
  if (!response.ok) throw new Error("증빙 사진을 업로드하지 못했습니다.");
  return upload.fileUrl;
}
