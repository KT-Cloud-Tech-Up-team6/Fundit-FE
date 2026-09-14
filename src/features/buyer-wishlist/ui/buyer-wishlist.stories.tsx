import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { BuyerWishlist } from "./buyer-wishlist";

function WishlistPreview({
  tab,
  initialEmpty,
}: {
  tab: "projects" | "sellers";
  initialEmpty?: boolean;
}) {
  const [selected, setSelected] = useState(tab);
  return <BuyerWishlist tab={selected} onTabChange={setSelected} initialEmpty={initialEmpty} />;
}

const meta = {
  title: "Features/BuyerWishlist",
  component: BuyerWishlist,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: { tab: "projects", onTabChange: () => {} },
  render: (args) => <WishlistPreview key={`${args.tab}-${args.initialEmpty}`} {...args} />,
} satisfies Meta<typeof BuyerWishlist>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Projects: Story = {};
export const Sellers: Story = { args: { tab: "sellers" } };
export const Empty: Story = { args: { initialEmpty: true } };
export const RemoveItems: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("총 6개");
    for (const button of canvas.getAllByRole("button", { name: /찜 해제/ }))
      await userEvent.click(button);
    await expect(canvas.getByRole("status")).toHaveTextContent("총 0개");
    await expect(canvas.getByText("찜한 프로젝트가 없습니다.")).toBeVisible();
    await userEvent.click(canvas.getByRole("tab", { name: "팔로잉" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("총 7개");
    for (const button of canvas.getAllByRole("button", { name: /팔로우/ }))
      await userEvent.click(button);
    await expect(canvas.getByRole("status")).toHaveTextContent("총 0개");
    await expect(canvas.getByText("팔로우한 판매자가 없습니다.")).toBeVisible();
    canvas.getByRole("tab", { name: "팔로잉" }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(canvas.getByRole("tab", { name: "찜 프로젝트" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(canvas.getByText("찜한 프로젝트가 없습니다.")).toBeVisible();
  },
};
