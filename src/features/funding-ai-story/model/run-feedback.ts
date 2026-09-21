import type { FundingStoryFailedSlot } from "@/entities/project/api/story-api";

const stageLabels: Record<FundingStoryFailedSlot["stage"], string> = {
  generation: "생성",
  rendering: "렌더링",
  upload: "업로드",
};

export function partialSuccessMessage(failedSlots: FundingStoryFailedSlot[]) {
  const failedSlotSummary = failedSlots
    .map((slot) => `${slot.slot_id}(${stageLabels[slot.stage]})`)
    .join(", ");

  return failedSlotSummary
    ? `일부 이미지를 만들지 못해 나머지 결과만 표시합니다. 누락된 이미지: ${failedSlotSummary}`
    : "일부 이미지를 만들지 못해 생성된 나머지 결과만 표시합니다.";
}
