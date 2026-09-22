import { apiRequest } from "../../../shared/api/client";

export type Address = {
  id: number;
  recipientName: string;
  phoneNumber: string;
  zipcode: string;
  addressLine1: string;
  addressLine2: string | null;
  isDefault: boolean;
};
export type AddressInput = Omit<Address, "id">;
export type Wish = {
  projectId: number;
  /* BE 스냅샷 동기화 전에는 필드가 없을 수 있다. 상세 연결은 projectDetailId로
     형식까지 검증한 뒤에만 연다. */
  projectPublicId?: string | null;
  projectTitle: string | null;
  projectThumbnailUrl: string | null;
  createdAt: string;
};
export function getAddresses(signal?: AbortSignal) {
  return apiRequest<Address[]>("/api/v1/addresses", { auth: true, signal });
}
export function registerAddress(body: AddressInput) {
  return apiRequest<Pick<Address, "id" | "recipientName" | "isDefault">>("/api/v1/addresses", {
    auth: true,
    method: "POST",
    body,
  });
}
export function getWishes(page: number, signal?: AbortSignal) {
  return apiRequest<{ content: Wish[]; totalElements: number; hasNext: boolean }>(
    `/api/v1/wishes?page=${page}&size=20`,
    { auth: true, signal },
  );
}
export function setWish(projectId: number, wished: boolean) {
  return apiRequest<{ projectId: number; wished: boolean } | void>(`/api/v1/wishes/${projectId}`, {
    auth: true,
    method: wished ? "PUT" : "DELETE",
  });
}
