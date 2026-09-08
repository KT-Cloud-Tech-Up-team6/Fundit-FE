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
      expect(button.getBoundingClientRect().width).toBe(180);
      expect(button.getBoundingClientRect().height).toBe(46);
    }
    await userEvent.click(canvas.getByRole("button", { name: "임시저장" }));
    expect(canvas.getByRole("status")).toHaveTextContent("목업 임시저장");
    await userEvent.click(canvas.getByRole("button", { name: "저장" }));
    expect(canvas.getByRole("alert")).toHaveTextContent("사업자 유형");
  },
};

export const RewardLifecycle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^리워드 추가$/ }));
    await userEvent.click(canvas.getByRole("button", { name: /^저장$/ }));
    expect(canvas.getByRole("alert")).toHaveTextContent("리워드 이름을 입력해주세요");
    await userEvent.type(canvas.getByRole("textbox", { name: "리워드 명" }), "테스트 패키지");
    await userEvent.type(canvas.getByRole("textbox", { name: /^가격$/ }), "29000");
    await userEvent.click(canvas.getByRole("checkbox", { name: "수량 제한" }));
    await userEvent.type(canvas.getByRole("textbox", { name: /^수량$/ }), "100");
    await userEvent.click(canvas.getByRole("checkbox", { name: /리워드 혜택 설정/ }));
    await userEvent.click(canvas.getByRole("checkbox", { name: /옵션 설정/ }));
    await userEvent.click(canvas.getByRole("button", { name: /^저장$/ }));
    expect(canvas.getByRole("table")).toHaveTextContent("테스트 패키지");
    expect(canvas.getByRole("table")).toHaveTextContent("29,000원");
    await userEvent.click(canvas.getByRole("button", { name: "테스트 패키지 수정" }));
    expect(canvas.getByRole("checkbox", { name: /옵션 설정/ })).toBeChecked();
    await userEvent.click(canvas.getByRole("checkbox", { name: "수량 제한" }));
    await userEvent.click(canvas.getByRole("button", { name: /^저장$/ }));
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
    const sub = () => canvas.getByRole("combobox", { name: "상세 카테고리" });
    const main = canvas.getByRole("combobox", { name: "대분류" });
    expect(sub()).toBeDisabled();
    await userEvent.click(main);
    expect(main).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(canvas.getByRole("option", { name: "홈 · 리빙" }));
    expect(main).toHaveTextContent("홈 · 리빙");
    expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(sub());
    await userEvent.keyboard("{End}{Enter}");
    expect(sub()).toHaveTextContent("청소 · 세탁");
    await userEvent.click(sub());
    expect(canvas.getByRole("option", { name: "청소 · 세탁" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.keyboard("{Home}{Escape}");
    expect(sub()).toHaveTextContent("청소 · 세탁");
    expect(sub()).toHaveFocus();
    await userEvent.click(main);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(main).toHaveTextContent("뷰티");
    expect(sub()).toHaveTextContent("상세");
    expect(sub()).toBeDisabled();
    await userEvent.click(main);
    await userEvent.click(canvas.getByRole("heading", { name: "기본 정보 등록" }));
    expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(main);
    await userEvent.tab();
    expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /^\+ 500,000$/ }));
    await userEvent.click(canvas.getByRole("button", { name: /^\+ 100,000$/ }));
    expect(canvas.getByRole("textbox", { name: "목표 금액" })).toHaveValue("600000");
    await userEvent.click(canvas.getByRole("button", { name: "지우기" }));
    expect(canvas.getByRole("textbox", { name: "목표 금액" })).toHaveValue("");
    await userEvent.click(canvas.getByRole("button", { name: /^저장$/ }));
    expect(canvas.getByRole("alert")).toHaveTextContent("사업자 유형");
  },
};

export const MainCategoryOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox", { name: "대분류" }));
    await userEvent.hover(canvas.getByRole("option", { name: "홈 · 리빙" }));
  },
};

export const SubcategoryOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox", { name: "대분류" }));
    await userEvent.click(canvas.getByRole("option", { name: "홈 · 리빙" }));
    await userEvent.click(canvas.getByRole("combobox", { name: "상세 카테고리" }));
    await userEvent.hover(canvas.getByRole("option", { name: "청소 · 세탁" }));
  },
};
