import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, fn, userEvent, within } from "storybook/test";
import { defaultSearch, type SearchQuery } from "../model/search-demo";
import { BuyerSearch } from "./buyer-search";

function SearchPreview({
  query,
  initialInput,
  onQueryChange,
}: {
  query: SearchQuery;
  initialInput?: string;
  onQueryChange: (query: SearchQuery) => void;
}) {
  const [state, setState] = useState(query);
  return (
    <BuyerSearch
      query={state}
      onQueryChange={(next) => {
        setState(next);
        onQueryChange(next);
      }}
      initialInput={initialInput}
    />
  );
}

const meta = {
  title: "Features/BuyerSearch",
  component: BuyerSearch,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: { query: defaultSearch, onQueryChange: () => {} },
  render: (args) => (
    <SearchPreview key={JSON.stringify(args.query) + args.initialInput} {...args} />
  ),
} satisfies Meta<typeof BuyerSearch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Typing: Story = { args: { initialInput: "판매자" } };
export const Projects: Story = { args: { query: { ...defaultSearch, q: "청소기" } } };
export const Live: Story = { args: { query: { ...defaultSearch, q: "청소기", tab: "live" } } };
export const Upcoming: Story = {
  args: { query: { ...defaultSearch, q: "청소기", tab: "live", status: "upcoming" } },
};
export const Sellers: Story = {
  args: { query: { ...defaultSearch, q: "판매자", tab: "sellers" } },
};
export const Empty: Story = { args: { query: { ...defaultSearch, q: "존재하지않는검색어" } } };

export const HistoryRestoration: Story = {
  render: function Render() {
    const [query, setQuery] = useState({ ...defaultSearch, q: "청소기" });
    return (
      <>
        <button type="button" onClick={() => setQuery(defaultSearch)}>
          이전 검색 상태
        </button>
        <button type="button" onClick={() => setQuery({ ...defaultSearch, q: "청소기" })}>
          다음 검색 상태
        </button>
        <BuyerSearch query={query} onQueryChange={setQuery} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "통합 검색어" });
    await fireEvent.change(input, { target: { value: "수박" } });
    await expect(canvas.getByRole("region", { name: "연관 검색어" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "이전 검색 상태" }));
    await expect(input).toHaveValue("");
    await userEvent.click(canvas.getByRole("button", { name: "다음 검색 상태" }));
    await expect(input).toHaveValue("청소기");
    await expect(canvas.queryByRole("region", { name: "연관 검색어" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("status")).toHaveTextContent("총 5개");
  },
};

export const EmptySubmission: Story = {
  args: { query: { ...defaultSearch, q: "청소기" }, onQueryChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await fireEvent.change(canvas.getByRole("textbox", { name: "통합 검색어" }), {
      target: { value: "" },
    });
    await fireEvent.submit(canvas.getByRole("search"));
    await expect(args.onQueryChange).toHaveBeenLastCalledWith({ ...defaultSearch, q: "" });
    await expect(canvas.getByRole("region", { name: "최근 검색어" })).toBeVisible();
    await fireEvent.change(canvas.getByRole("textbox", { name: "통합 검색어" }), {
      target: { value: "   " },
    });
    await fireEvent.submit(canvas.getByRole("search"));
    await expect(args.onQueryChange).toHaveBeenCalledTimes(2);
    await expect(canvas.getByRole("textbox", { name: "통합 검색어" })).toHaveValue("");
  },
};

export const Composition: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textbox = canvas.getByRole("textbox", { name: "통합 검색어" });
    await fireEvent.change(textbox, { target: { value: "청소기" } });
    await expect(canvas.getByRole("region", { name: "연관 검색어" })).toBeVisible();
    await fireEvent.compositionStart(textbox);
    await fireEvent.keyDown(textbox, { key: "Enter", isComposing: true, keyCode: 229 });
    await fireEvent.submit(canvas.getByRole("search"));
    await expect(canvas.queryByRole("tablist")).not.toBeInTheDocument();
    await fireEvent.compositionEnd(textbox);
    await fireEvent.submit(canvas.getByRole("search"));
    await expect(await canvas.findByRole("status")).toHaveTextContent("총 5개");
  },
};

export const SearchFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "무선 청소기 최근 검색어 삭제" }));
    await expect(
      canvas.queryByRole("button", { name: "무선 청소기 최근 검색어 삭제" }),
    ).not.toBeInTheDocument();
    await fireEvent.change(canvas.getByRole("textbox", { name: "통합 검색어" }), {
      target: { value: "청소기" },
    });
    await fireEvent.submit(canvas.getByRole("search"));
    await expect(canvas.getByRole("status")).toHaveTextContent("총 5개");
    await userEvent.click(canvas.getByRole("checkbox", { name: "종료 프로젝트 보기" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("총 6개");
    await userEvent.click(canvas.getByRole("tab", { name: "LIVE" }));
    await userEvent.click(canvas.getByRole("button", { name: "진행 예정" }));
    const notification = canvas.getAllByRole("button", { name: /시작 알림/ })[0];
    await userEvent.click(notification);
    await expect(notification).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "검색어 지우기" }));
    await expect(canvas.getByRole("region", { name: "최근 검색어" })).toBeVisible();
  },
};
