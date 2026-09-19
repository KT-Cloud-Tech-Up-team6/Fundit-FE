import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { ProjectConsentModal } from "./project-consent-modal";

const meta = {
  title: "Features/Project Privacy Consent",
  component: ProjectConsentModal,
  args: { onAgree: fn(), onClose: fn() },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProjectConsentModal>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Expanded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "서비스 이용약관 전문 펼치기" }));
    expect(canvas.getByRole("region", { name: "서비스 이용약관 전문" })).toBeVisible();
    expect(canvas.getByRole("checkbox", { name: "서비스 이용약관 동의 (필수)" })).not.toBeChecked();
  },
};

export const RequiredOnly: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const agree = canvas.getByRole("button", { name: "동의하기" });
    expect(agree).toBeDisabled();
    for (const checkbox of canvas.getAllByRole("checkbox", { name: /필수/ })) {
      await userEvent.click(checkbox);
    }
    expect(agree).toBeEnabled();
    expect(canvas.getByRole("checkbox", { name: "약관 전체 동의" })).not.toBeChecked();
    expect(canvas.getByRole("checkbox", { name: /마케팅/ })).not.toBeChecked();
    expect(canvas.getByRole("checkbox", { name: /AI 개인화/ })).not.toBeChecked();
    await userEvent.click(agree);
    expect(args.onAgree).toHaveBeenCalledTimes(1);
  },
};

export const AllSelections: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const all = canvas.getByRole("checkbox", { name: "약관 전체 동의" });
    const terms = canvas.getAllByRole("checkbox").slice(1);
    const agree = canvas.getByRole("button", { name: "동의하기" });
    for (let mask = 0; mask < 32; mask += 1) {
      for (const [index, checkbox] of terms.entries()) {
        const checked = Boolean(mask & (1 << index));
        if ((checkbox as HTMLInputElement).checked !== checked) await userEvent.click(checkbox);
      }
      expect((agree as HTMLButtonElement).disabled).toBe((mask & 7) !== 7);
      expect((all as HTMLInputElement).checked).toBe(mask === 31);
    }
    await userEvent.click(all);
    for (const checkbox of terms) expect(checkbox).not.toBeChecked();
    expect(agree).toBeDisabled();
    await userEvent.click(all);
    for (const checkbox of terms) expect(checkbox).toBeChecked();
  },
};

export const AiFullTerms: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "AI 개인화 서비스 활용 동의 전문 펼치기" }),
    );
    expect(
      canvas.getByRole("region", { name: "AI 개인화 서비스 활용 동의 전문" }),
    ).toHaveTextContent("인기순·신규순");
    expect(canvas.getByRole("checkbox", { name: /AI 개인화/ })).not.toBeChecked();
    await userEvent.click(
      canvas.getByRole("button", { name: "AI 개인화 서비스 활용 동의 전문 접기" }),
    );
    expect(canvas.queryByRole("region", { name: "AI 개인화 서비스 활용 동의 전문" })).toBeNull();
  },
};
