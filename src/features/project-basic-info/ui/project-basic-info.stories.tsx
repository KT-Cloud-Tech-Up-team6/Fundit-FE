import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { ProjectBasicInfoForm } from "./project-basic-info-form";

const meta = {
  title: "Features/Project Basic Info",
  component: ProjectBasicInfoForm,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="mx-auto max-w-300 px-5 xl:px-0">
      <ProjectBasicInfoForm key={args.initialView} {...args} />
    </div>
  ),
} satisfies Meta<typeof ProjectBasicInfoForm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Adding: Story = { args: { initialView: "adding" } };
export const RewardList: Story = { args: { initialView: "list" } };
export const AddToList: Story = { args: { initialView: "list-adding" } };

export const FooterButtons: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["임시저장", "저장"]) {
      const button = canvas.getByRole("button", { name });
      const label = within(button).getByText(name, { exact: true });
      const style = getComputedStyle(label);
      expect(style.fontSize).toBe("16px");
      expect(style.fontWeight).toBe("600");
      expect(style.lineHeight).toBe("24px");
      expect(button.getBoundingClientRect().width).toBe(186);
      expect(button.getBoundingClientRect().height).toBe(46);
    }
    await userEvent.click(canvas.getByRole("button", { name: "임시저장" }));
    expect(canvas.getByRole("status")).toHaveTextContent("목업 임시저장");
    expect(canvas.getByRole("button", { name: "저장" })).toBeDisabled();
  },
};

export const RewardLifecycle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^리워드 추가$/ }));
    const modal = within(canvas.getByRole("dialog", { name: "리워드 추가" }));
    const register = () => modal.getByRole("button", { name: /^등록$/ });
    /* FL_S_PR_CREATE_12~15: 저장에 필요한 입력을 채우기 전에는 등록이 비활성이다. */
    expect(register()).toBeDisabled();
    await userEvent.type(modal.getByRole("textbox", { name: "리워드 명" }), "테스트 패키지");
    expect(register()).toBeDisabled();
    await userEvent.type(modal.getByRole("textbox", { name: /^가격$/ }), "29000");
    expect(register()).toBeEnabled();
    await userEvent.click(modal.getByRole("checkbox", { name: "수량 제한" }));
    expect(register()).toBeDisabled();
    await userEvent.type(modal.getByRole("textbox", { name: /^수량$/ }), "100");
    await userEvent.click(modal.getByRole("checkbox", { name: /할인 설정/ }));
    expect(register()).toBeDisabled();
    await userEvent.type(modal.getByRole("textbox", { name: "할인 값" }), "5000");
    await userEvent.click(modal.getByRole("checkbox", { name: /옵션 설정/ }));
    expect(register()).toBeEnabled();
    await userEvent.click(register());
    expect(canvas.getByRole("table")).toHaveTextContent("테스트 패키지");
    expect(canvas.getByRole("table")).toHaveTextContent("29,000원");
    await userEvent.click(canvas.getByRole("button", { name: "테스트 패키지 수정" }));
    const editModal = within(canvas.getByRole("dialog", { name: "리워드 수정" }));
    expect(editModal.getByRole("checkbox", { name: /옵션 설정/ })).toBeChecked();
    await userEvent.click(editModal.getByRole("checkbox", { name: "수량 제한" }));
    await userEvent.click(editModal.getByRole("button", { name: /^등록$/ }));
    expect(canvas.getByRole("table")).toHaveTextContent("제한 없음");
    expect(canvas.getAllByRole("row")).toHaveLength(2);
    await userEvent.click(canvas.getByRole("button", { name: "테스트 패키지 삭제" }));
    expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    expect(canvas.getByText("등록된 리워드가 없습니다", { exact: false })).toBeVisible();
  },
};

export const CategoriesAndAmount: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sub = () => canvas.getByRole("button", { name: "상세 카테고리" });
    const main = canvas.getByRole("button", { name: "대분류" });
    expect(sub()).toBeDisabled();
    await userEvent.click(main);
    expect(main).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(canvas.getByRole("option", { name: "홈·리빙" }));
    expect(main).toHaveTextContent("홈·리빙");
    expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(sub());
    await userEvent.keyboard("{End}{Enter}");
    expect(sub()).toHaveTextContent("방향제");
    await userEvent.click(sub());
    expect(canvas.getByRole("option", { name: "방향제" })).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Home}{Escape}");
    expect(sub()).toHaveTextContent("방향제");
    expect(sub()).toHaveFocus();
    await userEvent.click(main);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(main).toHaveTextContent("뷰티");
    expect(sub()).toHaveTextContent("상세 카테고리를 선택하세요");
    expect(sub()).toBeEnabled();
    await userEvent.click(main);
    await userEvent.click(canvas.getByRole("heading", { name: "기본 정보 등록" }));
    expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(main);
    await userEvent.tab();
    expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /^\+500,000$/ }));
    await userEvent.click(canvas.getByRole("button", { name: /^\+100,000$/ }));
    expect(canvas.getByRole("textbox", { name: "목표 금액" })).toHaveValue("600000");
    await userEvent.click(canvas.getByRole("button", { name: "지우기" }));
    expect(canvas.getByRole("textbox", { name: "목표 금액" })).toHaveValue("");
    expect(canvas.getByRole("button", { name: /^저장$/ })).toBeDisabled();
  },
};

export const MainCategoryOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "대분류" }));
    await userEvent.hover(canvas.getByRole("option", { name: "홈·리빙" }));
  },
};

export const SubcategoryOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "대분류" }));
    await userEvent.click(canvas.getByRole("option", { name: "홈·리빙" }));
    await userEvent.click(canvas.getByRole("button", { name: "상세 카테고리" }));
    await userEvent.hover(canvas.getByRole("option", { name: "주방" }));
  },
};
