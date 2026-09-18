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

/** 최신 리워드 시트는 선택 전 드롭다운을 접어둔다. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("dialog", { name: "리워드 선택" });
    await expect(canvas.getByRole("button", { name: "펀딩하기" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "리워드" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  },
};

export const MultipleRewards: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("dialog", { name: "리워드 선택" });
    const choose = async (name: string) => {
      await userEvent.click(canvas.getByRole("button", { name: "리워드" }));
      await userEvent.click(
        within(canvas.getByRole("group", { name: "리워드 목록" })).getByRole("button", {
          name: new RegExp(name),
        }),
      );
    };
    await choose("가장 먼저 만나는 스타터 세트");
    await userEvent.click(
      canvas.getByRole("button", { name: "가장 먼저 만나는 스타터 세트 수량 늘리기" }),
    );
    await choose("한 번에 갖추는 올인원 패키지");
    await expect(canvas.getByRole("status", { name: "리워드 총 금액" })).toHaveTextContent(
      "667,000원",
    );
    await expect(canvas.getAllByRole("heading", { level: 3 })[0]).toHaveTextContent(
      "한 번에 갖추는 올인원 패키지",
    );
    await choose("가장 먼저 만나는 스타터 세트");
    await expect(canvas.getByRole("status", { name: "리워드 총 금액" })).toHaveTextContent(
      "667,000원",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "한 번에 갖추는 올인원 패키지 삭제" }),
    );
    await expect(canvas.getByRole("status", { name: "리워드 총 금액" })).toHaveTextContent(
      "398,000원",
    );
  },
};

export const MultipleOptionLines: Story = {
  args: { rewards: demoRewards() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("dialog", { name: "리워드 선택" });
    await userEvent.click(canvas.getByRole("button", { name: "리워드" }));
    await userEvent.click(canvas.getByRole("button", { name: /얼리버드 클린포지 R1/ }));
    await expect(canvas.getByRole("button", { name: "펀딩하기" })).toBeDisabled();
    const select = canvas.getByRole("combobox", { name: /얼리버드 클린포지 R1 색상/ });
    await userEvent.selectOptions(select, "블랙");
    await userEvent.selectOptions(select, "화이트");
    await userEvent.selectOptions(select, "블랙");
    await expect(canvas.getByRole("status", { name: "리워드 총 금액" })).toHaveTextContent(
      "1,797,000원",
    );
    await userEvent.click(canvas.getByRole("button", { name: "화이트 삭제" }));
    await expect(canvas.getByRole("status", { name: "리워드 총 금액" })).toHaveTextContent(
      "1,198,000원",
    );
  },
};
