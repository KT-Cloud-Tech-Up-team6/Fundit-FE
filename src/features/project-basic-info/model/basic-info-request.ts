import type { BasicInfoRequest, BusinessType } from "@/entities/project/api/seller-project-api";

export type BasicInfoValues = {
  business: string;
  title: string;
  category: string;
  subcategory: string;
  amount: string;
};
export const businessCodes: Record<string, BusinessType> = {
  "일반 사업자": "GENERAL",
  "개인 사업자": "SOLE",
  "법인 사업자": "CORP",
};

export function basicInfoRequest(values: BasicInfoValues): BasicInfoRequest {
  return {
    ...(values.business ? { businessType: businessCodes[values.business] } : {}),
    ...(values.title.trim() ? { title: values.title.trim() } : {}),
    ...(values.category ? { categoryMajor: values.category } : {}),
    ...(values.subcategory ? { categoryMinor: values.subcategory } : {}),
    ...(values.amount ? { goalAmount: Number(values.amount) } : {}),
  };
}

export function basicInfoApiError(values: BasicInfoValues, partial: boolean) {
  if (values.title.trim().length > 40) return "프로젝트 제목은 40자 이하로 입력해주세요.";
  if (
    values.amount &&
    (!/^\d+$/.test(values.amount) ||
      !Number.isSafeInteger(Number(values.amount)) ||
      Number(values.amount) < 500_000)
  ) {
    return "목표 금액은 최소 500,000원 이상의 정수로 입력해주세요.";
  }
  if (values.business && !businessCodes[values.business]) return "사업자 유형을 선택해주세요.";
  if (values.category && !values.subcategory) return "상세 카테고리를 선택해주세요.";
  if (!partial && (!values.title.trim() || !values.amount))
    return "제목과 목표 금액을 입력해주세요.";
  if (Object.keys(basicInfoRequest(values)).length === 0) return "저장할 기본 정보를 입력해주세요.";
  return "";
}
