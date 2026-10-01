import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import type { DeadlineCard, FeaturedCard, LiveCard } from "../model/home-cards";
import { BuyerHome } from "./buyer-home";

/* 실제 API 섹션(주목받는 프로젝트·실시간 LIVE·마감 임박)의 고정 값. 문구는 Figma 홈 `2315:72822`의 예시이고
   이미지는 저장소의 다른 목업 이미지를 빌려 쓴다. API 응답이 아니다. */
const featured: FeaturedCard[] = [
  ["피부 본연의 힘을 되찾는 저자극 비건 스킨케어", "악세사리", "프레시맵", "1,520", "e5d64"],
  ["집에서도 즐기는 카페의 맛 홈카페 에스프레소 머신", "테크·가전", "홈브루", "632", "ff65e"],
  ["더 가벼운 일상, 더 건강한 나 스마트 헬스케어 워치", "테크·가전", "모던테크랩", "892", "20f1f"],
  ["오늘도 더 좋은 잠, 프리미엄 메모리폼 매트리스", "침구", "슬립메이커", "1,218", "93c90"],
  ["더 가벼운 일상, 더 건강한 나 스마트 헬스케어 워치", "테크·가전", "모던테크랩", "892", "7ad9b"],
  ["오늘도 더 좋은 잠, 프리미엄 메모리폼 매트리스", "침구", "슬립메이커", "1,218", "ee561"],
  ["피부 본연의 힘을 되찾는 저자극 비건 스킨케어", "악세사리", "프레시맵", "1,520", "4b7ce"],
  ["집에서도 즐기는 카페의 맛 홈카페 에스프레소 머신", "테크·가전", "홈브루", "632", "413b1"],
].map(([title, category, seller, rate, image], index) => ({
  id: String(index + 1),
  href: `/projects/0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f0${index}`,
  title,
  category,
  seller,
  achievement: `${rate}% 달성`,
  image: `/images/buyer-live/${image}.png`,
}));

const lives: LiveCard[] = [
  {
    title: "속건조 잡는 꿀피부 레시피! 환절기 스킨케어 꿀팁 대공개",
    seller: "뷰티마켓",
    image: "0157a",
  },
  { title: "요알못도 셰프 만드는 스마트 주방가전 라이브!", seller: "키친템", image: "9d862" },
  { title: "찰랑이는 머릿결의 비밀! 미용실 클리닉을 집에서", seller: "헤어플러스", image: "a166a" },
  {
    title: "귀가 즐거워지는 시간, 프리미엄 앰프 & 스피커 라이브",
    seller: "사운드룸",
    image: "ce556",
  },
  /* BE #154 전의 응답처럼 판매자 닉네임이 없는 카드. 판매자 줄이 빠진다. */
  { title: "속건조 잡는 꿀피부 레시피! 환절기 스킨케어 꿀팁 대공개", image: "45a85" },
].map(({ image, ...card }, index) => ({
  ...card,
  id: `live-${index + 1}`,
  href: `/live/0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f1${index}`,
  viewers: "101",
  image: `/images/buyer-live/${image}.png`,
}));

/* 마감 임박은 Figma `2315:71837`의 문구·D-N·카드 이미지 그대로다. */
const deadline: DeadlineCard[] = [
  ["하루의 끝을 편안하게,\n스마트 수면 조명", "라이트온", "D-1"],
  ["매일 30초, 건강한 한 잔을 만드는 미니 블렌더", "블렌디", "D-3"],
  ["흩어진 책상을 한 번에 정리하는 모듈 데스크", "모듈랩", "D-1"],
  ["우리 아이의 식사 시간을 챙겨주는 스마트 급식기", "펫밸런스", "D-4"],
].map(([title, seller, dday], index) => ({
  id: `deadline-${index + 1}`,
  href: `/projects/0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f2${index}`,
  title,
  seller,
  dday,
  image: `/images/buyer-home/deadline-${index + 1}.jpg`,
}));

const onRetry = fn();

const meta = {
  title: "Features/BuyerHome/Main",
  component: BuyerHome,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    viewport: {
      options: {
        figma390: { name: "Figma 390 × 844", styles: { width: "390px", height: "844px" } },
        desktop: { name: "Desktop 1440 × 900", styles: { width: "1440px", height: "900px" } },
      },
    },
  },
  globals: { viewport: { value: "figma390" } },
  args: {
    featured: { status: "ready", items: featured },
    lives: { status: "ready", items: lives },
    deadline: { status: "ready", items: deadline },
  },
} satisfies Meta<typeof BuyerHome>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const navigation = within(canvas.getByRole("navigation", { name: "홈 화면 하단 메뉴" }));
    expect(navigation.getByRole("link", { name: "홈" })).toHaveAttribute("aria-current", "page");
    expect(canvas.getByRole("search")).toHaveAttribute("action", "/search");
    expect(canvas.getByPlaceholderText("검색어를 입력하세요")).toHaveAttribute("name", "q");
    expect(canvas.getByRole("button", { name: "알림함 (준비중)" })).toBeDisabled();
    const categories = within(canvas.getByRole("navigation", { name: "카테고리 바로가기" }));
    expect(categories.getAllByRole("link")).toHaveLength(7);
    expect(categories.getByRole("link", { name: "캐릭터·굿즈" })).toHaveAttribute(
      "href",
      "/categories/characters-goods",
    );
    const featuredList = within(canvas.getByRole("list", { name: "지금 주목받는 프로젝트 목록" }));
    expect(featuredList.getAllByRole("link")[0]).toHaveAttribute("href", featured[0].href);
    const liveSection = within(canvas.getByRole("region", { name: "실시간 LIVE" }));
    expect(liveSection.getByRole("link", { name: "전체보기" })).toHaveAttribute("href", "/live");
    const liveLinks = within(liveSection.getByRole("list")).getAllByRole("link");
    expect(liveLinks.map((link) => link.getAttribute("href"))).toEqual(
      lives.map((card) => card.href),
    );
    expect(liveLinks[4]).not.toHaveTextContent("뷰티마켓");
    expect(liveSection.queryByText("라이브 특가")).not.toBeInTheDocument();
    for (const title of ["지금 주목받는 프로젝트", "마감 임박 프로젝트", "추천 프로젝트"])
      expect(canvas.getByRole("button", { name: `${title} 전체보기 (준비중)` })).toBeDisabled();
    const deadlineList = within(canvas.getByRole("list", { name: "마감 임박 프로젝트 목록" }));
    expect(deadlineList.getAllByText(/^D-\d$/).map((badge) => badge.textContent)).toEqual([
      "D-1",
      "D-3",
      "D-1",
      "D-4",
    ]);
    expect(deadlineList.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(
      deadline.map((card) => card.href),
    );
    const recommended = within(canvas.getByRole("list", { name: "추천 프로젝트 목록" }));
    expect(recommended.getAllByRole("link")).toHaveLength(8);
    for (const link of recommended.getAllByRole("link"))
      expect(link).toHaveAttribute("href", "/projects/demo-project");
    expect(canvas.queryByText("추천 라이브")).not.toBeInTheDocument();
    expect(canvas.getByText("1/3")).toBeInTheDocument();
  },
};

export const Desktop: Story = {
  globals: { viewport: { value: "desktop" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByPlaceholderText("검색어를 입력해주세요")).toBeVisible();
    expect(
      canvas.getByText("지금 많은 사람들이 지지하는 핫한 프로젝트를 만나보세요."),
    ).toBeVisible();
    expect(canvas.getByText("Fundit이 엄선한 특별한 프로젝트를 만나보세요.")).toBeVisible();
    expect(canvas.getByRole("heading", { name: "실시간 LIVE 진행 중!" })).toBeVisible();
    expect(canvas.getByRole("link", { name: "라이브 전체보기" })).toHaveAttribute("href", "/live");
    const banner = within(canvas.getByRole("region", { name: "프로모션 배너" }));
    for (const link of banner.getAllByRole("link"))
      expect(link).toHaveAttribute("href", "/projects/demo-project");
    expect(banner.getAllByText("지금 펀딩하기")[0]).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "다음 배너" }));
    await waitFor(() => expect(canvas.getByText("2/3")).toBeInTheDocument(), { timeout: 3000 });
    await userEvent.click(canvas.getByRole("button", { name: "이전 배너" }));
    await waitFor(() => expect(canvas.getByText("1/3")).toBeInTheDocument(), { timeout: 3000 });
    /* 끝과 처음이 이어진다. 첫 장의 이전은 마지막 장, 마지막 장의 다음은 첫 장이다. */
    await userEvent.click(canvas.getByRole("button", { name: "이전 배너" }));
    await waitFor(() => expect(canvas.getByText("3/3")).toBeInTheDocument(), { timeout: 3000 });
    await userEvent.click(canvas.getByRole("button", { name: "다음 배너" }));
    await waitFor(() => expect(canvas.getByText("1/3")).toBeInTheDocument(), { timeout: 3000 });
    /* 홈은 LIVE·카테고리 화면이 아니라 PC 헤더의 두 메뉴가 모두 비활성이다. */
    const menu = within(canvas.getByRole("navigation", { name: "구매자 주요 메뉴" }));
    for (const name of ["카테고리", "라이브"])
      expect(menu.getByRole("link", { name })).not.toHaveAttribute("aria-current");
  },
};

/* 실제 API 섹션은 실패·빈 목록에도 제목을 남기고 안내를 보인다. */
export const ErrorAndEmpty: Story = {
  args: {
    featured: { status: "error", onRetry },
    lives: { status: "ready", items: [] },
    deadline: { status: "ready", items: [] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = within(canvas.getByRole("region", { name: "지금 주목받는 프로젝트" }));
    expect(section.getByText(/지금 주목받는 프로젝트를 불러오지 못했습니다\./)).toBeInTheDocument();
    onRetry.mockClear();
    await userEvent.click(section.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledOnce();
    const liveSection = within(canvas.getByRole("region", { name: "실시간 LIVE" }));
    expect(liveSection.getByText("지금 진행 중인 LIVE가 없습니다.")).toBeInTheDocument();
    const deadlineSection = within(canvas.getByRole("region", { name: "마감 임박 프로젝트" }));
    expect(deadlineSection.getByText("마감 임박 프로젝트가 없습니다.")).toHaveAttribute(
      "role",
      "status",
    );
  },
};

export const Loading: Story = {
  args: {
    featured: { status: "loading" },
    lives: { status: "loading" },
    deadline: { status: "loading" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText("지금 주목받는 프로젝트를 불러오고 있습니다.")).toHaveAttribute(
      "role",
      "status",
    );
    expect(canvas.getByText("실시간 LIVE를 불러오고 있습니다.")).toHaveAttribute("role", "status");
    expect(canvas.getByText("마감 임박 프로젝트를 불러오고 있습니다.")).toHaveAttribute(
      "role",
      "status",
    );
  },
};
