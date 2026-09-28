import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { FollowedSeller } from "@/entities/seller/api/follow-api";
import { FollowingListApi } from "./following-list-api";

const sellers = Array.from({ length: 21 }, (_, index) => ({
  sellerId: `seller-${index + 1}`,
  sellerNickname: `판매자 ${index + 1}`,
  createdAt: "2026-09-28T00:00:00Z",
}));

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
    await userEvent.click(await canvas.findByRole("button", { name: "판매자 1 팔로우 해제" }));
    await expect(await canvas.findByRole("button", { name: "판매자 1 다시 팔로우" })).toBeVisible();
    await expect(
      await canvas.findByRole("button", { name: "판매자 21 팔로우 해제" }),
    ).toBeVisible();
    await userEvent.click(await canvas.findByRole("button", { name: "판매자 1 다시 팔로우" }));
    await expect(await canvas.findByRole("button", { name: "판매자 1 팔로우 해제" })).toBeVisible();
  },
};
