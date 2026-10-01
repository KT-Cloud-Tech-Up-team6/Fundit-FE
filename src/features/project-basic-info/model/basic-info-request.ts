import type { BasicInfoRequest, BusinessType } from "@/entities/project/api/seller-project-api";
import { projectCategories } from "@/entities/category/model/project-categories";

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

export type BasicInfoField =
  "business" | "title" | "category" | "subcategory" | "amount" | "rewards";
export type BasicInfoErrors = Partial<Record<BasicInfoField, string>>;
/** 화면에 나타나는 순서. 첫 오류 칸으로 포커스를 옮길 때 이 순서를 따른다. */
export const basicInfoFields: readonly BasicInfoField[] = [
  "business",
  "title",
  "category",
  "subcategory",
  "amount",
  "rewards",
];
/** draft는 임시저장(형식만 검사), edit은 기존 프로젝트 저장(제목·목표 금액 필수),
    create는 신규 생성 저장(사업자 유형·카테고리·리워드까지 모두 필수). */
export type BasicInfoLevel = "draft" | "edit" | "create";

/** 칸마다 오류 문구를 돌려준다. 비어 있으면 저장해도 된다. */
export function basicInfoFieldErrors(
  values: BasicInfoValues,
  level: BasicInfoLevel,
  rewardCount = 0,
): BasicInfoErrors {
  const errors: BasicInfoErrors = {};
  const required = level !== "draft";
  const all = level === "create";
  const title = values.title.trim();
  if (values.business ? !businessCodes[values.business] : all)
    errors.business = "사업자 유형을 선택해주세요.";
  if (title.length > 40) errors.title = "프로젝트 제목은 40자 이하로 입력해주세요.";
  else if (!title && required) errors.title = "프로젝트 제목을 입력해주세요.";
  if (values.category && !values.subcategory) errors.subcategory = "상세 카테고리를 선택해주세요.";
  else if (values.category || values.subcategory) {
    if (!projectCategories[values.category]?.includes(values.subcategory))
      errors.category = "프로젝트 카테고리와 상세 카테고리를 목록에서 다시 선택해주세요.";
  } else if (all) errors.category = "대분류와 상세 카테고리를 선택해주세요.";
  if (values.amount) {
    if (
      !/^\d+$/.test(values.amount) ||
      !Number.isSafeInteger(Number(values.amount)) ||
      Number(values.amount) < 500_000
    )
      errors.amount = "목표 금액은 최소 500,000원 이상의 정수로 입력해주세요.";
  } else if (required) errors.amount = "목표 금액을 입력해주세요.";
  if (all && rewardCount === 0) errors.rewards = "리워드를 최소 1개 등록해주세요.";
  return errors;
}
