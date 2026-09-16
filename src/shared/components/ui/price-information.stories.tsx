import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PriceInformation } from "./price-information";
const meta = {
  title: "Shared/UI/PriceInformation",
  component: PriceInformation,
  tags: ["autodocs"],
  args: { price: "599,000원", originalPrice: "699,000원", caption: "쿠폰 적용가" },
} satisfies Meta<typeof PriceInformation>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const PriceOnly: Story = { args: { originalPrice: undefined, caption: undefined } };
export const WithoutCaption: Story = { args: { caption: undefined } };
export const LongContent: Story = {
  decorators: [
    (Story) => (
      <div className="w-60 max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    price: "999,999,999원",
    originalPrice: "1,000,000,000원",
    caption: "보유 쿠폰 모두 적용 시",
  },
};
