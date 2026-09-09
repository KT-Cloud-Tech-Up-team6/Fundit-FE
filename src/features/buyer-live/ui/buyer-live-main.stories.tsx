import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { BuyerLiveMain } from "./buyer-live-main";

const meta = {
  title: "Features/BuyerLive/Main",
  component: BuyerLiveMain,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
} satisfies Meta<typeof BuyerLiveMain>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SubscriptionKeyboard: Story = {
  args: { view: "upcoming" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const subscriptions = within(canvas.getByRole("region", { name: "알림 신청한 라이브" }));
    const nextButton = subscriptions.getAllByRole("button")[2];
    for (const article of subscriptions.getAllByRole("article")) {
      const card = within(article);
      const title = card.getByRole("heading").textContent;
      expect(card.getAllByRole("link")[0]).toHaveAccessibleName(`${title} 라이브 보기`);
      expect(card.getByRole("button")).toHaveAccessibleName(`${title} 시작 알림`);
    }
    subscriptions.getAllByRole("button")[1].focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(nextButton).toHaveFocus());
    while (subscriptions.queryAllByRole("button").length) {
      await userEvent.click(subscriptions.getAllByRole("button")[0]);
    }
    await waitFor(() =>
      expect(subscriptions.getByText("알림 신청한 라이브가 없습니다.")).toHaveFocus(),
    );
    expect(
      canvas.getByRole("button", { name: "예정된 라이브 전체보기 · 화면 미정" }),
    ).toBeDisabled();
  },
};

export const RecommendationKeyboard: Story = {
  args: { view: "upcoming" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const recommendations = within(canvas.getByRole("region", { name: "추천 라이브" }));
    for (const count of [20, 30]) {
      recommendations.getByRole("button", { name: "추천 라이브 더 불러오기" }).focus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(recommendations.getAllByRole("article")).toHaveLength(count));
      expect(
        within(recommendations.getAllByRole("article")[count - 10]).getByRole("link"),
      ).toHaveFocus();
    }
    expect(
      recommendations.queryByRole("button", { name: "추천 라이브 더 불러오기" }),
    ).not.toBeInTheDocument();
    expect(canvas.getByRole("status")).toHaveTextContent("마지막 목록입니다.");
  },
};

export const UpcomingNoFollowing: Story = {
  args: { view: "upcoming", hasFollowing: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByRole("region", { name: "팔로우한 판매자" })).not.toBeInTheDocument();
    expect(canvas.getByRole("region", { name: "알림 신청한 라이브" })).toBeInTheDocument();
    expect(canvas.getByRole("link", { name: "예정 라이브" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("region", { name: "팔로우한 판매자" })).toBeInTheDocument();
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
    expect(canvas.queryByRole("region", { name: "팔로우한 판매자" })).not.toBeInTheDocument();
    expect(canvas.getByRole("region", { name: "추천 라이브" })).toBeInTheDocument();
  },
};

export const NotificationToggle: Story = {
  args: { view: "upcoming" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const followCards = within(
      canvas.getByRole("region", { name: "팔로우한 판매자 예정 라이브 목록" }),
    ).getAllByRole("article");
    const button = within(followCards[1]).getByRole("button", { name: /알림 받기$/ });
    const title = within(followCards[1]).getByRole("heading").textContent;
    expect(button).toHaveAccessibleName(`${title} 알림 받기`);
    expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    const subscriptions = within(canvas.getByRole("region", { name: "알림 신청한 라이브" }));
    expect(button).toHaveAccessibleName(`${title} 알림 설정됨`);
    expect(subscriptions.getByRole("button", { name: `${title} 시작 알림` })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(canvas.getByRole("status")).toHaveTextContent("시작 알림을 설정했습니다");
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(
      subscriptions.queryByRole("button", { name: `${title} 시작 알림` }),
    ).not.toBeInTheDocument();
    expect(canvas.getByRole("status")).toHaveTextContent("시작 알림을 해제했습니다");
    expect(subscriptions.getAllByRole("button")[2]).toHaveAttribute("aria-pressed", "true");
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
    const bottomNav = within(canvas.getByRole("navigation", { name: "LIVE 화면 하단 메뉴" }));
    expect(bottomNav.getByRole("link", { name: "라이브" })).toHaveAttribute("aria-current", "page");
    expect(bottomNav.getByRole("link", { name: "홈" })).toHaveAttribute("href", "/");
    expect(bottomNav.getByRole("link", { name: "마이" })).toHaveAttribute("href", "/my");
    expect(canvas.getByRole("link", { name: "실시간 순위 전체보기" })).toHaveAttribute(
      "href",
      "/live/rank",
    );
  },
};
