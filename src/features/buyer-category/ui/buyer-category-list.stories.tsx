import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { BuyerCategoryList } from "./buyer-category-list";

const meta = {
  title: "Features/BuyerCategory/List",
  component: BuyerCategoryList,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: { slug: "tech-appliances" },
} satisfies Meta<typeof BuyerCategoryList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("heading", { name: "테크·가전", level: 2 })).toBeInTheDocument();
    expect(canvas.getByRole("link", { name: "테크·가전" })).toHaveAttribute("aria-current", "page");
    expect(canvas.getByRole("link", { name: "홈·리빙" })).toHaveAttribute(
      "href",
      "/categories/home-living",
    );
    expect(canvas.getByRole("button", { name: "테크·가전 더보기 · 화면 미정" })).toBeDisabled();
    expect(canvas.getByRole("button", { name: "카테고리 · 화면 미정" })).toBeDisabled();
  },
};

export const Travel: Story = {
  args: { slug: "travel" },
};
