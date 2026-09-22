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
/* 수정·기본 지정은 등록과 달리 목록 항목 전체를 돌려준다. 서버가 회원당 기본 배송지를 한 개로
   맞추므로(다른 항목의 기본 해제 포함) 응답을 그대로 쓰고 FE에서 기본값을 다시 계산하지 않는다. */
export function updateAddress(addressId: number, body: AddressInput) {
  return apiRequest<Address>(`/api/v1/addresses/${addressId}`, {
    auth: true,
    method: "PUT",
    body,
  });
}
export function changeDefaultAddress(addressId: number) {
  return apiRequest<Address>(`/api/v1/addresses/${addressId}/default`, {
    auth: true,
    method: "PATCH",
  });
}
/** 204. 기본 배송지를 지워도 서버가 다른 배송지를 기본으로 올리지 않는다. */
export function deleteAddress(addressId: number) {
  return apiRequest<void>(`/api/v1/addresses/${addressId}`, {
    auth: true,
    method: "DELETE",
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
