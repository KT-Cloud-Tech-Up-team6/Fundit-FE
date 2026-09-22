import { apiRequest } from "../../../shared/api/client";
import { ApiError } from "../../../shared/api/api-error";

/* 조회(`refund-api.ts`)와 달리 신청·증빙은 payment-service의 다른 계약을 쓴다.
   v1 요청은 fundingId가 Long이라 컨트롤러가 order-service를 한 번 더 조회해 UUID로
   바꾼다. FE는 이미 UUID를 들고 있으므로 v2를 쓴다. */

export type RefundEstimate = {
  orderId: string;
  rewardAmount: number;
  shippingFee: number;
  discountAmount: number;
  refundAmount: number;
};

/** 서버가 계산한 예상 환불액. FE가 금액을 직접 계산해 고지하지 않는다. */
export function getRefundEstimate(orderId: string, signal?: AbortSignal) {
  return apiRequest<RefundEstimate>(
    `/api/v1/refunds/estimate?orderId=${encodeURIComponent(orderId)}`,
    { auth: true, signal },
  );
}

export type RefundDefectType = "DEFECTIVE" | "DAMAGED" | "DIFFERENT_FROM_DESCRIPTION";

export type RefundRequestCreated = { refundId: number; status: string };

/** 판매자 승인 대기 상태로 접수된다. 이 시점에 결제가 취소되지는 않는다. */
export function requestDefectRefund(body: {
  fundingId: string;
  defectType: RefundDefectType;
  reasonDetail: string;
  evidenceUrls: string[];
}) {
  return apiRequest<RefundRequestCreated>("/api/v2/refunds/defect", {
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
