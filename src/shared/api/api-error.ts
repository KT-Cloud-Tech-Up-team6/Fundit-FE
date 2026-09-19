export type ApiErrorDetail = unknown;

export class ApiError extends Error {
  readonly code: string;
  readonly detail?: ApiErrorDetail;
  readonly status: number;

  constructor({
    code,
    detail,
    message,
    status,
  }: {
    code: string;
    detail?: ApiErrorDetail;
    message: string;
    status: number;
  }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.detail = detail;
    this.status = status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
