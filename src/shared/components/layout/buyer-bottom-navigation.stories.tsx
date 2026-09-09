import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { BuyerBottomNavigation } from "./buyer-bottom-navigation";

const meta = {
  title: "Shared/Layout/BuyerBottomNavigation",
  component: BuyerBottomNavigation,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: { activeHref: "/live" },
  argTypes: { activeHref: { control: "select", options: ["/", "/live", "/my"] } },
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-[390px]">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement, args }) => {
    const nav = within(within(canvasElement).getByRole("navigation", { name: "구매자 하단 메뉴" }));
    const links = nav.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/", "/live", "/my"]);
    for (const link of links) {
      if (link.getAttribute("href") === args.activeHref) {
        expect(link).toHaveAttribute("aria-current", "page");
      } else {
        expect(link).not.toHaveAttribute("aria-current");
      }
    }
    expect(nav.getByRole("button", { name: "카테고리 · 화면 미정" })).toBeDisabled();
    links[0].focus();
    await userEvent.tab();
    expect(links[1]).toHaveFocus();
    await userEvent.tab();
    expect(links[2]).toHaveFocus();
  },
} satisfies Meta<typeof BuyerBottomNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {};
export const Home: Story = { args: { activeHref: "/" } };
export const My: Story = { args: { activeHref: "/my" } };
export const NoSelection: Story = { args: { activeHref: undefined } };
