import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Button, secondaryButtonClasses } from "./button";
import { Footer } from "./footer";
const meta = {
  title: "Shared/UI/Footer",
  component: Footer,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[390px] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: { children: <Button appearance="cta">펀딩하기</Button> },
} satisfies Meta<typeof Footer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const TwoActions: Story = {
  args: {
    children: (
      <>
        <button type="button" className={`${secondaryButtonClasses} text-body-strong h-[46px]`}>
          장바구니
        </button>
        <Button appearance="cta">펀딩하기</Button>
      </>
    ),
  },
};
export const WithLike: Story = {
  render: function Render(args) {
    const [liked, setLiked] = useState(false);
    return (
      <Footer
        {...args}
        leading={
          <button
            type="button"
            aria-label="프로젝트 좋아요"
            aria-pressed={liked}
            onClick={() => setLiked(!liked)}
            className="text-body-s focus-visible:outline-border-primary flex flex-col items-center leading-[1.42] focus-visible:outline-2"
          >
            <span
              aria-hidden
              className="size-6 bg-current [mask-image:url('/icons/molecules/heart.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]"
            />
            <span>{liked ? "10000" : "9999+"}</span>
          </button>
        }
      />
    );
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "프로젝트 좋아요" });
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-pressed", "true");
  },
};
export const Disabled: Story = {
  args: {
    children: (
      <Button appearance="cta" disabled>
        펀딩하기
      </Button>
    ),
  },
};
