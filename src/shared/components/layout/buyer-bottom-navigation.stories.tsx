import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { BuyerBottomNavigation } from "./buyer-bottom-navigation";

const meta = {
  title: "Shared/Layout/BuyerBottomNavigation",
  component: BuyerBottomNavigation,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: { activeHref: "/live" },
  argTypes: { activeHref: { control: "select", options: ["/", "/live", "/categories", "/my"] } },
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-[390px]">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement, args }) => {
    const navElement = within(canvasElement).getByRole("navigation", { name: "구매자 하단 메뉴" });
    const nav = within(navElement);
    const isCategoriesActive = args.activeHref === "/categories";

    if (isCategoriesActive) {
      expect(nav.getByRole("button", { name: "카테고리" })).toHaveAttribute("aria-current", "page");
    } else {
      const categoriesLink = nav.getByRole("link", { name: "카테고리" });
      expect(categoriesLink).toHaveAttribute("href", "/categories/tech-appliances");
      expect(categoriesLink).not.toHaveAttribute("aria-current");
    }

    const links = nav.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      isCategoriesActive
        ? ["/", "/live", "/my"]
        : ["/", "/live", "/categories/tech-appliances", "/my"],
    );
    for (const link of links) {
      if (link.getAttribute("href") === args.activeHref) {
        expect(link).toHaveAttribute("aria-current", "page");
      } else {
        expect(link).not.toHaveAttribute("aria-current");
      }
    }

    // 카테고리 탭이 button/link 사이를 오가므로 role별 목록이 아니라 DOM 순서로 탭 순서를 확인한다.
    const focusableItems = Array.from(navElement.querySelectorAll<HTMLElement>("a, button"));
    focusableItems[0].focus();
    for (let i = 1; i < focusableItems.length; i++) {
      await userEvent.tab();
      expect(focusableItems[i]).toHaveFocus();
    }
  },
} satisfies Meta<typeof BuyerBottomNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {};
export const Home: Story = { args: { activeHref: "/" } };
export const Categories: Story = { args: { activeHref: "/categories" } };
export const My: Story = { args: { activeHref: "/my" } };
export const NoSelection: Story = { args: { activeHref: undefined } };
