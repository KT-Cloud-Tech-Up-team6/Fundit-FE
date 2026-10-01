import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { ShippingAddressSheet } from "./shipping-address-sheet";

const meta = {
  title: "Features/Order Checkout/Shipping Address Sheet",
  component: ShippingAddressSheet,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  args: { open: true, onClose: fn(), onSave: fn() },
} satisfies Meta<typeof ShippingAddressSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 빈 상태 — 우편번호·주소는 "우편번호 찾기"로만 채우고, 필수 미입력이라 저장 비활성. */
export const Empty: Story = {
  args: { initial: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("dialog");
    await expect(canvas.getByRole("heading", { name: "배송지 입력" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "우편번호 찾기" })).toBeInTheDocument();
    await expect(canvas.getByLabelText("우편번호")).toHaveAttribute("readonly");
    await expect(canvas.getByRole("button", { name: "저장" })).toBeDisabled();
  },
};

/** 우편번호를 찾은 뒤 상태 — 상세주소는 선택이라 비어 있어도 저장할 수 있고(#528), onSave 로 전체 배송지가 넘어간다.
 *  연락처는 칸에서만 하이픈을 붙여 보이고 넘길 때는 숫자만 넘긴다. */
export const PostcodeFound: Story = {
  args: {
    initial: {
      recipientName: "홍길동",
      phone: "010-1111-2222",
      zipCode: "06099",
      baseAddress: "서울 강남구 학동로 343",
      detailAddress: "",
      deliveryMemo: "",
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("dialog");
    const save = canvas.getByRole("button", { name: "저장" });

    await expect(canvas.getByLabelText("연락처")).toHaveValue("010-1111-2222");
    // 상세주소가 비어 있어도 저장 활성
    await expect(save).toBeEnabled();

    await userEvent.type(canvas.getByLabelText("상세주소"), "3층 301호");
    await expect(save).toBeEnabled();

    await userEvent.type(canvas.getByLabelText("배송 요청 사항"), "부재 시 문 앞");
    await userEvent.click(save);

    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientName: "홍길동",
        phone: "01011112222",
        zipCode: "06099",
        baseAddress: "서울 강남구 학동로 343",
        detailAddress: "3층 301호",
        deliveryMemo: "부재 시 문 앞",
      }),
    );
  },
};

/** 연락처 형식 오류(QA-061~063) — 다른 칸이 모두 차 있어도 형식이 틀리면 안내가 보이고 저장이 꺼진다. */
export const InvalidPhone: Story = {
  args: {
    initial: {
      recipientName: "홍길동",
      phone: "010123",
      zipCode: "06099",
      baseAddress: "서울 강남구 학동로 343",
      detailAddress: "3층 301호",
      deliveryMemo: "",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("dialog");
    const save = canvas.getByRole("button", { name: "저장" });

    await expect(canvas.getByRole("alert")).toHaveTextContent("휴대폰 번호 형식을 확인해 주세요.");
    await expect(save).toBeDisabled();
    await expect(canvas.getByLabelText("연락처")).toHaveValue("010-123");

    const phone = canvas.getByLabelText("연락처");
    await userEvent.clear(phone);
    await userEvent.type(phone, "010");
    // 입력 중에는 안내하지 않고, 칸을 벗어난 뒤에 보인다
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent.tab();
    await expect(canvas.getByRole("alert")).toBeInTheDocument();
    await userEvent.clear(phone);
    // 숫자가 아닌 글자는 입력되지 않고, 하이픈은 직접 넣든 안 넣든 자동으로 들어간다(#528)
    await userEvent.type(phone, "abc");
    await expect(phone).toHaveValue("");
    await userEvent.type(phone, "01011112222");
    await expect(phone).toHaveValue("010-1111-2222");
    await userEvent.clear(phone);
    await userEvent.type(phone, "010-1111-2222");
    await expect(phone).toHaveValue("010-1111-2222");
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    await expect(save).toBeEnabled();
  },
};
