import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { RewardSheet } from "./reward-sheet";
import { FundingCta } from "./funding-cta";
import { demoRewards } from "../model/reward-demo";
import { toRewards } from "../model/public-reward";

/* 실제 프로젝트의 리워드 조회 응답(BE RewardConsumerResponse, null 필드는 키가 빠진다)을
   화면 모델로 옮긴 값. 정률·정액 얼리 버드, 품절, 옵션 그룹 2개·재고 3개를 담는다. */
const apiRewards = toRewards(
  [
    {
      rewardId: 11,
      rewardDisplayCode: "R-11",
      name: "얼리버드 컬러 세트",
      description: "본체 · 브러시 2종",
      price: 200_000,
      isEarlyBird: true,
      earlyBirdDiscountType: "RATE",
      earlyBirdDiscountValue: 10,
      earlyBirdDiscountedPrice: 180_000,
      isLimited: true,
      remainingStock: 3,
      options: [
        {
          groupId: 1,
          groupName: "색상",
          values: [
            { valueId: 101, value: "블랙" },
            { valueId: 102, value: "화이트" },
          ],
        },
        {
          groupId: 2,
          groupName: "사이즈",
          values: [
            { valueId: 201, value: "S" },
            { valueId: 202, value: "L" },
          ],
        },
      ],
      soldOut: false,
      shippingFee: 0,
      estimatedDeliveryDays: 7,
    },
    {
      rewardId: 12,
      rewardDisplayCode: "R-12",
      name: "정액 할인 기본 세트",
      description: "본체 · 충전 어댑터",
      price: 150_000,
      isEarlyBird: true,
      earlyBirdDiscountType: "AMOUNT",
      earlyBirdDiscountValue: 20_000,
      earlyBirdDiscountedPrice: 130_000,
      isLimited: false,
      options: [],
      soldOut: false,
      shippingFee: 3000,
      estimatedDeliveryDays: 14,
    },
    {
      rewardId: 13,
      rewardDisplayCode: "R-13",
      name: "품절된 한정 세트",
      description: "본체 2대",
      price: 300_000,
      isEarlyBird: false,
      isLimited: true,
      remainingStock: 0,
      options: [],
      soldOut: true,
      shippingFee: 0,
    },
  ],
  "2026-10-27T14:59:59Z",
);

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
    await expect(canvas.getByRole("button", { name: /^리워드 \(\d+개\)$/ })).toHaveAttribute(
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
      await userEvent.click(canvas.getByRole("button", { name: /^리워드 \(\d+개\)$/ }));
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
    await userEvent.click(canvas.getByRole("button", { name: /^리워드 \(\d+개\)$/ }));
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

/** 실제 프로젝트 리워드(모바일 390): 얼리 버드 표시, 품절 비활성, 옵션 그룹 2개 조합 줄, 재고 상한, 제출값. */
export const ApiRewards: Story = {
  args: { projectId: "api-project", rewards: apiRewards, onSubmit: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dialog = within(await canvas.findByRole("dialog", { name: "리워드 선택" }));
    const trigger = dialog.getByRole("button", { name: "리워드 (3개)" });
    await userEvent.click(trigger);
    const list = within(dialog.getByRole("group", { name: "리워드 목록" }));
    const rate = list.getByRole("button", { name: /얼리버드 컬러 세트/ });
    await expect(rate).toHaveTextContent("얼리 버드 10%");
    await expect(rate).toHaveTextContent("200,000원180,000원");
    await expect(rate).toHaveTextContent("본체 · 브러시 2종 · 무료배송 · 예상 발송일 2026.11.03");
    const amount = list.getByRole("button", { name: /정액 할인 기본 세트/ });
    await expect(within(amount).getByText("얼리 버드")).toBeInTheDocument();
    await expect(amount).toHaveTextContent("150,000원130,000원");
    await expect(amount).toHaveTextContent("배송비 3,000원 · 예상 발송일 2026.11.10");
    const soldOut = list.getByRole("button", { name: /품절된 한정 세트/ });
    await expect(soldOut).toBeDisabled();
    await expect(soldOut).toHaveTextContent("품절");

    await userEvent.click(rate);
    const color = dialog.getByRole("combobox", { name: "얼리버드 컬러 세트 색상" });
    const size = dialog.getByRole("combobox", { name: "얼리버드 컬러 세트 사이즈" });
    await userEvent.selectOptions(color, "블랙");
    await expect(dialog.queryByText("블랙 / L")).not.toBeInTheDocument();
    await expect(dialog.getByRole("button", { name: "펀딩하기" })).toBeDisabled();
    await userEvent.selectOptions(size, "L");
    await userEvent.selectOptions(color, "화이트");
    await userEvent.selectOptions(size, "S");
    await userEvent.click(dialog.getByRole("button", { name: "블랙 / L 수량 늘리기" }));
    await expect(dialog.getByRole("button", { name: "블랙 / L 수량 늘리기" })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "화이트 / S 수량 늘리기" })).toBeDisabled();
    await expect(color).toBeDisabled();
    await expect(dialog.getByRole("status", { name: "리워드 총 금액" })).toHaveTextContent(
      "540,000원",
    );

    await userEvent.click(trigger);
    await userEvent.click(
      within(dialog.getByRole("group", { name: "리워드 목록" })).getByRole("button", {
        name: /정액 할인 기본 세트/,
      }),
    );
    await expect(dialog.getAllByRole("heading", { level: 3 })[0]).toHaveTextContent(
      "정액 할인 기본 세트",
    );
    await expect(dialog.getByRole("status", { name: "리워드 총 금액" })).toHaveTextContent(
      "670,000원",
    );
    await userEvent.click(dialog.getByRole("button", { name: "펀딩하기" }));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      "reward-12": [{ value: null, quantity: 1 }],
      "reward-11": [
        { value: "블랙 / L", quantity: 2, optionValueIds: [101, 202] },
        { value: "화이트 / S", quantity: 1, optionValueIds: [102, 201] },
      ],
    });
  },
};

/** 실제 프로젝트 리워드(웹 1440): 상세 오른쪽 인라인 선택과 펀딩하기 제출 버튼. */
export const ApiRewardsInline: Story = {
  args: {
    projectId: "api-project",
    rewards: apiRewards,
    onSubmit: fn(),
    inlineFormId: "api-rewards",
  },
  render: (args) => (
    <div className="mx-auto flex w-[446px] flex-col gap-4 p-5">
      <RewardSheet {...args} />
      <FundingCta
        projectId={args.projectId}
        desktopFormId="api-rewards"
        rewards={args.rewards}
        onSubmit={args.onSubmit}
      />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    if (!window.matchMedia("(min-width: 1200px)").matches) return;
    const canvas = within(canvasElement);
    const form = within(canvas.getByRole("form", { name: "웹 리워드 선택" }));
    const trigger = form.getByRole("button", { name: "리워드 (3개)" });
    await userEvent.click(canvas.getByRole("button", { name: "펀딩하기" }));
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(args.onSubmit).not.toHaveBeenCalled();
    await userEvent.click(form.getByRole("button", { name: /정액 할인 기본 세트/ }));
    await userEvent.click(trigger);
    await userEvent.click(form.getByRole("button", { name: /얼리버드 컬러 세트/ }));
    await userEvent.selectOptions(form.getByRole("combobox", { name: /색상$/ }), "블랙");
    await userEvent.selectOptions(form.getByRole("combobox", { name: /사이즈$/ }), "S");
    await expect(
      within(form.getByRole("group", { name: "선택한 리워드" })).getAllByRole("heading")[0],
    ).toHaveTextContent("얼리버드 컬러 세트");
    await expect(form.getByRole("status", { name: "리워드 총 금액" })).toHaveTextContent(
      "310,000원",
    );
    await userEvent.click(canvas.getByRole("button", { name: "펀딩하기" }));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      "reward-11": [{ value: "블랙 / S", quantity: 1, optionValueIds: [101, 201] }],
      "reward-12": [{ value: null, quantity: 1 }],
    });
  },
};
