import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { RewardSheet } from "./reward-sheet";
import { demoRewards } from "../model/reward-demo";

const meta = {
  title: "Features/Reward Selection",
  component: RewardSheet,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  args: { projectId: "demo", open: true, onClose: fn() },
} satisfies Meta<typeof RewardSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 진입 기본값 — 담은 리워드 없음. `펀딩하기`가 비활성이고 총 금액은 0원. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("dialog", { name: "리워드 선택" });
    await expect(canvas.getByRole("button", { name: "펀딩" })).toBeDisabled();

    const totalRow = canvas.getByText("총 금액").parentElement as HTMLElement;
    await expect(totalRow).toHaveClass("sr-only");
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(5);

    // 키보드로 접근 가능한 닫기 버튼이 onClose를 호출한다.
    await userEvent.click(canvas.getByRole("button", { name: "리워드 선택 닫기" }));
    await expect(args.onClose).toHaveBeenCalled();
  },
};

/** 한 리워드에서 옵션 조합을 여러 줄로 담기 — 블랙 + 화이트를 각각 수량과 함께. */
export const MultipleOptionLines: Story = {
  args: { rewards: demoRewards() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("dialog", { name: "리워드 선택" });
    const submit = canvas.getByRole("button", { name: "펀딩" });
    const totalRow = canvas.getByText("총 금액").parentElement as HTMLElement;

    // 얼리버드를 담으면 색상 드롭다운만 뜨고 줄은 없음 → CTA 비활성.
    await userEvent.click(canvas.getByRole("checkbox", { name: "얼리버드 클린포지 R1" }));
    await expect(submit).toBeDisabled();
    await expect(canvas.getByText("옵션을 선택해 주세요.")).toBeVisible();

    const colorSelect = canvas.getByRole("combobox", { name: /얼리버드 클린포지 R1 색상/ });

    // 블랙 선택 → 블랙 줄 추가, 총액 = 599,000, CTA 활성.
    await userEvent.selectOptions(colorSelect, "블랙");
    await expect(canvas.getByRole("button", { name: "블랙 삭제" })).toBeVisible();
    await expect(submit).toBeEnabled();
    await expect(within(totalRow).getByText("599,000원")).toBeVisible();

    // 화이트 선택 → 화이트 줄 추가, 총액 = 599,000 × 2.
    await userEvent.selectOptions(colorSelect, "화이트");
    await expect(within(totalRow).getByText("1,198,000원")).toBeVisible();

    // 블랙 다시 선택 → 블랙 줄 수량 +1 (새 줄 아님), 총액 = 599,000 × 3.
    await userEvent.selectOptions(colorSelect, "블랙");
    await expect(canvas.getAllByRole("button", { name: "블랙 삭제" })).toHaveLength(1);
    await expect(within(totalRow).getByText("1,797,000원")).toBeVisible();

    // 블랙 줄 수량 늘리기 → 총액 = 599,000 × 4. (버튼 라벨에 줄 이름이 들어간다)
    await userEvent.click(canvas.getByRole("button", { name: "블랙 수량 늘리기" }));
    await expect(within(totalRow).getByText("2,396,000원")).toBeVisible();

    // 화이트 줄 삭제 → 총액 = 599,000 × 3.
    await userEvent.click(canvas.getByRole("button", { name: "화이트 삭제" }));
    await expect(canvas.queryByRole("button", { name: "화이트 삭제" })).toBeNull();
    await expect(within(totalRow).getByText("1,797,000원")).toBeVisible();

    // 옵션 없는 디럭스를 추가로 담으면 수량 1짜리 줄이 자동 생겨 합산된다.
    await userEvent.click(canvas.getByRole("checkbox", { name: "디럭스 소모품 풀세트" }));
    await expect(within(totalRow).getByText("2,586,000원")).toBeVisible();
    await expect(submit).toBeEnabled();
  },
};

export const Selected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("checkbox", { name: "가장 먼저 만나는 스타터 세트" }),
    );
    expect(canvas.getByRole("button", { name: "펀딩" })).toBeEnabled();
    expect(
      canvas.getByRole("button", { name: "가장 먼저 만나는 스타터 세트 수량 줄이기" }),
    ).toBeDisabled();
    expect(canvas.getByRole("status", { name: "리워드 총 금액" }).textContent).toContain(
      "199,000원",
    );
  },
};

export const MultipleRewards: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const starter = await canvas.findByRole("checkbox", { name: "가장 먼저 만나는 스타터 세트" });
    const bundle = canvas.getByRole("checkbox", { name: "한 번에 갖추는 올인원 패키지" });
    await userEvent.click(starter);
    await userEvent.click(bundle);
    expect(starter).toBeChecked();
    expect(bundle).toBeChecked();
    expect(canvas.getByRole("status", { name: "리워드 총 금액" }).textContent).toContain(
      "468,000원",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "가장 먼저 만나는 스타터 세트 수량 늘리기" }),
    );
    expect(canvas.getByRole("status", { name: "리워드 총 금액" }).textContent).toContain(
      "667,000원",
    );
    await userEvent.click(starter);
    expect(canvas.getByRole("status", { name: "리워드 총 금액" }).textContent).toContain(
      "269,000원",
    );
  },
};
