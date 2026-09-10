import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { FundingCta } from "@/features/reward-selection/ui/funding-cta";
import { BuyerProjectDetail } from "./buyer-project-detail";
import styles from "./buyer-project-detail.module.css";

const meta = {
  title: "Features/BuyerProject/Detail",
  component: BuyerProjectDetail,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: {
    projectId: "demo-project",
    activeTab: "story",
    fundingAction: <FundingCta projectId="demo-project" className={styles.funding} />,
  },
} satisfies Meta<typeof BuyerProjectDetail>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("link", { name: "리워드 정보" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(canvas.getByRole("link", { name: /LIVE 체크/ })).toHaveAttribute(
      "href",
      "/projects/demo-project?tab=live-proof",
    );
    expect(canvas.getByRole("img", { name: /CleanForge/ })).toBeInTheDocument();
    const like = canvas.getByRole("button", { name: "프로젝트 찜" });
    await userEvent.click(like);
    expect(like).toHaveAttribute("aria-pressed", "true");
    expect(like).toHaveTextContent("10000");
    await userEvent.click(like);
    expect(like).toHaveTextContent("9999");
  },
};

export const LiveCheck: Story = {
  args: { activeTab: "live-proof" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("link", { name: /LIVE 체크/ })).toHaveAttribute("aria-current", "page");
    expect(
      within(canvas.getByRole("region", { name: "종료된 라이브 목록" })).getAllByRole("article"),
    ).toHaveLength(3);
    expect(
      within(canvas.getByRole("region", { name: "숏 클립 목록" })).getAllByRole("article"),
    ).toHaveLength(3);
    expect(
      within(canvas.getByRole("region", { name: "LIVE Q&A" })).getAllByRole("article"),
    ).toHaveLength(3);
    await userEvent.click(canvas.getByRole("button", { name: /^종료된 라이브 1/ }));
    expect(canvas.getByRole("status")).toHaveTextContent("영상 재생은 아직 연결되지 않은 목업");
  },
};

export const InformationTip: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "AI 프로젝트 요약 안내" });
    await userEvent.click(button);
    expect(canvas.getByRole("tooltip")).toHaveTextContent("판매자의 검토 및 수정");
    expect(canvas.getByRole("tooltip")).toHaveTextContent(
      "정확한 사항은 구매 전 문의해 주시기 바랍니다.",
    );
    const body = canvas.getByRole("tooltip").lastElementChild as HTMLElement;
    expect(getComputedStyle(body).backgroundColor).toBe("rgb(237, 237, 237)");
    expect(getComputedStyle(body).fontSize).toBe("11px");
    expect(getComputedStyle(body).fontWeight).toBe("500");
    await userEvent.keyboard("{Escape}");
    expect(canvas.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  },
};

export const LiveInformationTip: Story = {
  ...InformationTip,
  args: { activeTab: "live-proof" },
  play: async (context) => {
    await InformationTip.play?.(context);
    const canvas = within(context.canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "LIVE Q&A 안내" }));
    expect(canvas.getByRole("tooltip")).toHaveTextContent(
      "정확한 사항은 구매 전 문의해 주시기 바랍니다.",
    );
    expect(canvas.getByRole("button", { name: "프로젝트 찜" })).toHaveTextContent("9999+");
    await userEvent.keyboard("{Escape}");
    expect(canvas.queryByRole("tooltip")).not.toBeInTheDocument();
  },
};

export const FundingSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "펀딩하기" });
    await userEvent.click(trigger);
    const dialog = await canvas.findByRole("dialog");
    expect(dialog).toBeVisible();
    await userEvent.keyboard("{Escape}");
    expect(dialog).not.toBeVisible();
    expect(trigger).toHaveFocus();
  },
};
