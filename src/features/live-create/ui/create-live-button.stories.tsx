import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { CreateLiveButton } from "./create-live-button";

const meta = {
  title: "Features/LiveCreate/CueSheetIntegration",
  component: CreateLiveButton,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CreateLiveButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ProjectToSavedCueSheet: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "라이브 생성하기" }));
    let dialog = within(await canvas.findByRole("dialog"));
    await userEvent.selectOptions(dialog.getByRole("combobox", { name: "카테고리 선택" }), "가방");
    await userEvent.click(dialog.getByRole("button", { name: "선택" }));
    await userEvent.type(dialog.getByRole("textbox", { name: "소개 문구" }), "가방 전용 소개 문구");
    await userEvent.click(dialog.getByRole("button", { name: "다음" }));
    await userEvent.click(dialog.getByRole("button", { name: "AI 큐시트 생성" }));
    dialog = within(await canvas.findByRole("dialog", { name: /친환경 소재로 만든 데일리 백/ }));
    await userEvent.type(dialog.getByRole("textbox", { name: "AI에게 답변" }), "가방 개발 이야기");
    await userEvent.click(dialog.getByRole("button", { name: "답변 보내기" }));
    for (let index = 0; index < 4; index++)
      await userEvent.click(dialog.getByRole("button", { name: "건너뛰기" }));
    await userEvent.click(dialog.getByRole("button", { name: "다음으로" }));
    await expect(dialog.getByText("가방 전용 소개 문구")).toBeVisible();
    await expect(dialog.queryByText(/로보락/)).not.toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "다음으로" }));
    await userEvent.click(dialog.getByRole("radio", { name: /대사 완성/ }));
    const minutes = dialog.getByRole("spinbutton", { name: "방송 시간 설정" });
    await userEvent.clear(minutes);
    await userEvent.type(minutes, "5");
    await userEvent.click(dialog.getByRole("button", { name: "큐시트 생성하기" }));
    const save = await dialog.findByRole("button", { name: "저장하기" }, { timeout: 5000 });
    const script = dialog.getByRole("textbox", { name: "대사" });
    await expect((script as HTMLTextAreaElement).value).toContain("친환경 소재로 만든 데일리 백");
    await userEvent.clear(script);
    await userEvent.type(script, "수정한 가방 오프닝");
    await userEvent.click(save);
    dialog = within(await canvas.findByRole("dialog", { name: "LIVE 생성하기" }));
    await expect(dialog.getByRole("textbox", { name: "소개 문구" })).toHaveValue(
      "가방 전용 소개 문구",
    );
    await expect(dialog.getByRole("status")).toHaveTextContent("저장된 목업 큐시트");
    await userEvent.click(dialog.getByRole("button", { name: "AI 큐시트 생성" }));
    dialog = within(await canvas.findByRole("dialog", { name: /친환경 소재로 만든 데일리 백/ }));
    await expect(dialog.getByRole("textbox", { name: "대사" })).toHaveValue("수정한 가방 오프닝");
    await userEvent.click(dialog.getByRole("button", { name: "뒤로가기" }));
    await userEvent.click(dialog.getByRole("button", { name: "뒤로가기" }));
    await expect(dialog.getByText("가방 개발 이야기")).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "닫기" }));
    dialog = within(await canvas.findByRole("dialog", { name: "LIVE 생성하기" }));
    await expect(dialog.getByRole("textbox", { name: "소개 문구" })).toHaveValue(
      "가방 전용 소개 문구",
    );
  },
};
