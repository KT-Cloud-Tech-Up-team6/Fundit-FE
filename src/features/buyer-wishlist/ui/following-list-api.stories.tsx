import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { FollowedSeller } from "@/entities/seller/api/follow-api";
import { FollowingListApi } from "./following-list-api";

const sellers = Array.from({ length: 21 }, (_, index) => ({
  sellerId: `seller-${index + 1}`,
  sellerNickname: `판매자 ${index + 1}`,
  followerCount: 10 + index,
  wishCount: index * 2,
  createdAt: "2026-09-28T00:00:00Z",
}));
/* 방송 중인 판매자. 21번은 무한 스크롤로 불러오는 둘째 페이지에 있다. */
const liveSellerIds = new Set(["seller-1", "seller-3", "seller-21"]);

function FollowingPreview() {
  const [unfollowed, setUnfollowed] = useState<ReadonlyMap<string, FollowedSeller>>(new Map());
  return (
    <FollowingListApi
      memberId="storybook-member"
      unfollowed={unfollowed}
      onUnfollowedChange={(change) => setUnfollowed(change)}
    />
  );
}

const meta = {
  title: "Features/BuyerWishlist/FollowingListApi",
  component: FollowingListApi,
  parameters: { layout: "padded" },
  render: () => <FollowingPreview />,
} satisfies Meta<typeof FollowingListApi>;
export default meta;
type Story = StoryObj<typeof meta>;

/** 실제 API 컴포넌트의 무한 스크롤용 페이지 응답과 해제·재팔로우 흐름을 모의한다. */
export const InfiniteFollowAndRestore: Story = {
  args: {
    memberId: "storybook-member",
    unfollowed: new Map(),
    onUnfollowedChange: () => {},
  },
  beforeEach: () => {
    const originalFetch = window.fetch;
    const followed = new Set(sellers.map(({ sellerId }) => sellerId));

    window.fetch = async (input, init) => {
      const url = new URL(
        input instanceof Request ? input.url : String(input),
        window.location.origin,
      );
      const method = init?.method ?? "GET";
      const sellerId = url.pathname.split("/").at(-1);
      if (url.pathname === "/api/v1/follows" && method === "GET") {
        const page = Number(url.searchParams.get("page") ?? 0);
        const size = Number(url.searchParams.get("size") ?? 20);
        const rows = sellers.filter(({ sellerId: id }) => followed.has(id));
        return Response.json({
          content: rows.slice(page * size, (page + 1) * size),
          page,
          size,
          totalElements: rows.length,
          totalPages: Math.max(1, Math.ceil(rows.length / size)),
          hasNext: (page + 1) * size < rows.length,
        });
      }
      if (url.pathname === "/api/v1/lives" && method === "GET") {
        const asked = url.searchParams.get("sellerId")?.split(",") ?? [];
        const content = asked
          .filter((id) => liveSellerIds.has(id))
          .map((id) => ({
            liveId: `live-${id}`,
            introText: null,
            status: "LIVE",
            projectId: "project-1",
            thumbnailUrl: null,
            scheduledStartAt: null,
            likeCount: 0,
            createdAt: "2026-09-29T00:00:00Z",
            sellerId: id,
          }));
        return Response.json({
          content,
          page: 0,
          size: 20,
          totalElements: content.length,
          totalPages: 1,
          hasNext: false,
        });
      }
      if (sellerId && url.pathname.startsWith("/api/v1/follows/")) {
        if (method === "DELETE") followed.delete(sellerId);
        if (method === "PUT") followed.add(sellerId);
        return method === "DELETE"
          ? new Response(null, { status: 204 })
          : Response.json({ sellerId, following: true });
      }
      return originalFetch(input, init);
    };
    return () => {
      window.fetch = originalFetch;
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = () => canvas.getByRole("article", { name: "판매자 1" });
    await expect(await canvas.findByRole("article", { name: "판매자 1" })).toHaveTextContent(
      "팔로워 10",
    );
    // 방송 중인 판매자만 LIVE 배지가 붙는다.
    await waitFor(() => expect(row()).toHaveTextContent("LIVE"));
    await expect(canvas.getByRole("article", { name: "판매자 2" })).not.toHaveTextContent("LIVE");
    await userEvent.click(await canvas.findByRole("button", { name: "판매자 1 팔로우 해제" }));
    await expect(await canvas.findByRole("button", { name: "판매자 1 다시 팔로우" })).toBeVisible();
    // 해제 직후 남는 행은 본인 팔로우를 뺀 수를 보인다.
    await expect(row()).toHaveTextContent("팔로워 9");
    await expect(
      await canvas.findByRole("button", { name: "판매자 21 팔로우 해제" }),
    ).toBeVisible();
    // 해제한 행과 더 불러온 행도 방송 중이면 배지가 있다.
    await waitFor(() =>
      expect(canvas.getByRole("article", { name: "판매자 21" })).toHaveTextContent("LIVE"),
    );
    await expect(row()).toHaveTextContent("LIVE");
    await userEvent.click(await canvas.findByRole("button", { name: "판매자 1 다시 팔로우" }));
    await expect(await canvas.findByRole("button", { name: "판매자 1 팔로우 해제" })).toBeVisible();
    await expect(row()).toHaveTextContent("팔로워 10");
  },
};
