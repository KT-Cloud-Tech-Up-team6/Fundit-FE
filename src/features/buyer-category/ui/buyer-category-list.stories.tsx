import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { BuyerCategoryList } from "./buyer-category-list";

const meta = {
  title: "Features/BuyerCategory/List",
  component: BuyerCategoryList,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    viewport: {
      options: {
        figma390: { name: "Figma 390 × 844", styles: { width: "390px", height: "844px" } },
        desktop: { name: "Desktop 1280 × 800", styles: { width: "1280px", height: "800px" } },
      },
    },
  },
  globals: { viewport: { value: "figma390" } },
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
    expect(canvas.getByRole("button", { name: "테크·가전 더보기 (준비중)" })).toBeDisabled();
    expect(canvas.getByRole("button", { name: "카테고리" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    /* 소분류는 무조건 LIVE 홈으로 보낸다(#307). */
    expect(canvas.getByRole("link", { name: "생활가전" })).toHaveAttribute("href", "/live");
  },
};

export const Beauty: Story = {
  args: { slug: "beauty" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("heading", { name: "뷰티", level: 2 })).toBeInTheDocument();
    for (const name of ["스킨케어", "메이크업", "헤어케어", "네일", "향수"])
      expect(canvas.getByRole("link", { name })).toHaveAttribute("href", "/live");
  },
};

export const HomeLiving: Story = { args: { slug: "home-living" } };
export const Desktop: Story = { globals: { viewport: { value: "desktop" } } };
