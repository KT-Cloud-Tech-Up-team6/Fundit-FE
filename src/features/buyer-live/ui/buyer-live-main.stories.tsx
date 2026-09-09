import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { BuyerLiveMain } from "./buyer-live-main";

const meta = {
  title: "Features/BuyerLive/Main",
  component: BuyerLiveMain,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
} satisfies Meta<typeof BuyerLiveMain>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("region", { name: "팔로우 브랜드" })).toBeInTheDocument();
    const cards = within(canvas.getByRole("region", { name: "신규 오픈 라이브 목록" }));
    const badge = cards.getAllByText("101")[0];
    badge.scrollIntoView({ block: "center" });
    const rect = badge.getBoundingClientRect();
    const target = canvasElement.ownerDocument.elementFromPoint(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
    );
    expect(target?.closest("a")).toHaveAttribute("href", "/live/new-1");
  },
};

export const NoFollowing: Story = {
  args: { hasFollowing: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByRole("region", { name: "팔로우 브랜드" })).not.toBeInTheDocument();
    expect(canvas.getByRole("region", { name: "추천 라이브" })).toBeInTheDocument();
  },
};

export const NotificationToggle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "팔로우 라이브 2 시작 알림" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(canvas.getByRole("status")).toHaveTextContent("목업 시작 알림을 설정했습니다");
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(canvas.getByRole("status")).toHaveTextContent("목업 시작 알림을 해제했습니다");
    expect(canvas.getByRole("button", { name: "팔로우 라이브 3 시작 알림" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};

export const SearchAndNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("textbox", { name: "라이브 검색" });
    await userEvent.type(search, "로보락");
    expect(search).toHaveValue("로보락");
    await userEvent.click(canvas.getByRole("button", { name: "검색어 지우기" }));
    expect(search).toHaveValue("");
    expect(canvas.getByRole("link", { name: "예정 라이브" })).toHaveAttribute(
      "href",
      "/live/upcoming",
    );
    expect(canvas.getByRole("button", { name: "카테고리 · 화면 미정" })).toBeDisabled();
    expect(canvas.getByRole("link", { name: "실시간 순위 더보기" })).toHaveAttribute(
      "href",
      "/live/rank",
    );
  },
};
