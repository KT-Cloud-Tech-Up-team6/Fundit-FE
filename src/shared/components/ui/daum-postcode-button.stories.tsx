import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { DaumPostcodeButton } from "./daum-postcode-button";

const meta = {
  title: "Shared/UI/DaumPostcodeButton",
  component: DaumPostcodeButton,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { onComplete: fn() },
} satisfies Meta<typeof DaumPostcodeButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/* 실제 다음 우편번호 스크립트는 CDN에서 로드되므로 Storybook에서는 로드 전 비활성 상태만 보인다. */
export const Loading: Story = {};

/** window.daum을 스토리 전용으로 흉내내 클릭 시 onComplete로 전달되는 값을 확인한다. */
export const Ready: Story = {
  decorators: [
    (Story) => {
      window.daum = {
        Postcode: class {
          constructor(
            private options: {
              oncomplete: (data: {
                zonecode: string;
                roadAddress: string;
                jibunAddress: string;
              }) => void;
            },
          ) {}
          embed() {
            this.open();
          }
          open() {
            this.options.oncomplete({
              zonecode: "06099",
              roadAddress: "서울 강남구 학동로 343",
              jibunAddress: "",
            });
          }
        },
      };
      return <Story />;
    },
  ],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "우편번호 찾기" });
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(args.onComplete).toHaveBeenCalledWith({
      zipCode: "06099",
      baseAddress: "서울 강남구 학동로 343",
    });
  },
};
