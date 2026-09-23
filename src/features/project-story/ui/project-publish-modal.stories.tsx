import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { PublishConfirmModal, PublishMissingModal, PublishedModal } from "./project-publish-modal";

const projectId = "0f8b5a2e-4c1d-4e6b-9a7f-2d3c4b5a6e7f";

const meta = {
  title: "Features/Project Publish Modal",
  component: PublishConfirmModal,
  args: { busy: false, onCancel: fn(), onConfirm: fn() },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PublishConfirmModal>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Confirm: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = within(canvasElement.ownerDocument.body).getByRole("dialog", {
      name: "프로젝트를 공개할까요?",
    });
    await userEvent.click(within(dialog).getByRole("button", { name: "공개하기" }));
    expect(args.onConfirm).toHaveBeenCalledTimes(1);
  },
};

export const Publishing: Story = {
  args: { busy: true },
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement.ownerDocument.body).getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "공개하는 중" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "취소" })).toBeDisabled();
  },
};

export const Failed: Story = {
  args: { error: "공개하지 못했습니다. 잠시 후 다시 시도해주세요." },
};

export const Missing: StoryObj<typeof PublishMissingModal> = {
  render: () => (
    <PublishMissingModal
      items={["basicInfo", "rewards"]}
      message=""
      projectId={projectId}
      onClose={fn()}
    />
  ),
};

export const Published: StoryObj<typeof PublishedModal> = {
  render: () => <PublishedModal projectId={projectId} onClose={fn()} />,
};
