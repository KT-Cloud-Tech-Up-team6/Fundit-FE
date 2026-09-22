"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWishes, setWish, type Wish } from "@/entities/member/api/member-api";
import { MemberAccess } from "@/features/buyer-mypage/ui/member-access";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { Button } from "@/shared/components/ui/button";
import { Tab, TabList } from "@/shared/components/ui/tab";
import { projectDetailId } from "@/shared/lib/project-detail-id";

export function BuyerWishlistApi() {
  return (
    <MemberAccess>
      {(member) => <Wishlist key={member.memberId} memberId={member.memberId} />}
    </MemberAccess>
  );
}
function Wishlist({ memberId }: { memberId: string }) {
  const params = useSearchParams(),
    router = useRouter(),
    client = useQueryClient();
  const sellers = params.get("tab") === "sellers";
  const raw = Number(params.get("page") ?? 1),
    page = Number.isSafeInteger(raw) && raw > 0 ? raw - 1 : 0;
  const key = ["member-wishes", memberId];
  const list = useQuery({
    queryKey: [...key, page],
    queryFn: ({ signal }) => getWishes(page, signal),
    enabled: !sellers,
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [removed, setRemoved] = useState<Wish | null>(null);
  const saving = useRef(false);
  async function change(item: Wish, wished: boolean) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await setWish(item.projectId, wished);
      setRemoved(wished ? null : item);
      await client.invalidateQueries({ queryKey: key });
    } catch {
      setError("찜 변경에 실패했습니다. 다시 시도해주세요.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <BuyerAccountScreen title="관심 목록" className="w-full max-[1200px]:max-w-none">
      <TabList
        aria-label="관심 목록 종류"
        selectedIndex={sellers ? 1 : 0}
        onSelectedIndexChange={(index) =>
          router.push(index ? "/my/wishlist?tab=sellers" : "/my/wishlist")
        }
        className="w-full!"
      >
        <Tab
          id="wishlist-projects"
          aria-controls="wishlist-panel"
          className="text-body-s! w-auto! flex-1"
        >
          찜 프로젝트
        </Tab>
        <Tab
          id="wishlist-sellers"
          aria-controls="wishlist-panel"
          className="text-body-s! w-auto! flex-1"
        >
          팔로잉
        </Tab>
      </TabList>
      <section
        id="wishlist-panel"
        role="tabpanel"
        aria-labelledby={sellers ? "wishlist-sellers" : "wishlist-projects"}
        className="space-y-3 px-5 pt-3 pb-5"
      >
        {sellers ? (
          <p>팔로잉 조회는 준비 중입니다.</p>
        ) : (
          <>
            {error && <p role="alert">{error}</p>}
            {removed && (
              <div role="status">
                찜을 해제했습니다.{" "}
                <button
                  disabled={busy}
                  onClick={() => void change(removed, true)}
                  className="underline"
                >
                  찜 다시 등록
                </button>
              </div>
            )}
            {list.isPending ? (
              <p role="status">관심 목록을 불러오고 있습니다.</p>
            ) : list.isError ? (
              <p role="alert">
                관심 목록 조회 실패. <button onClick={() => void list.refetch()}>다시 시도</button>
              </p>
            ) : (
              <>
                <p className="text-text-disabled text-body-s">총 {list.data.totalElements}개</p>
                {!list.data.content.length && (
                  <p className="py-24 text-center">찜한 프로젝트가 없습니다.</p>
                )}
                {list.data.content.map((item) => {
                  const detailId = projectDetailId(item.projectPublicId);
                  return (
                    <article key={item.projectId} className="flex items-center gap-3">
                      <div className="bg-layer-bg relative aspect-[144/106] w-[41.14%] shrink-0 overflow-hidden rounded-xs">
                        {item.projectThumbnailUrl && (
                          <Image
                            unoptimized
                            fill
                            sizes="144px"
                            src={item.projectThumbnailUrl}
                            alt=""
                            className="object-cover"
                          />
                        )}
                        {detailId && (
                          <Link
                            href={`/projects/${detailId}`}
                            aria-label={`${item.projectTitle || "프로젝트"} 상세 보기`}
                            className="focus-visible:outline-border-primary absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-body-m line-clamp-2">
                          {detailId ? (
                            <Link href={`/projects/${detailId}`}>
                              {item.projectTitle || "프로젝트"}
                            </Link>
                          ) : (
                            item.projectTitle || "프로젝트"
                          )}
                        </h2>
                        {!detailId && (
                          <p className="text-caption-s text-text-disabled mt-2">
                            프로젝트 정보를 준비 중입니다.
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`${item.projectTitle || "프로젝트"} 찜 해제`}
                        onClick={() => void change(item, false)}
                        className="bg-layer-surface-primary text-text-inverse flex size-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
                      >
                        <span
                          aria-hidden
                          className="size-4 bg-current [mask-image:url('/icons/buyer-account/heart.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
                        />
                      </button>
                    </article>
                  );
                })}
                <div className="flex justify-between">
                  <Button
                    disabled={page === 0}
                    onClick={() => router.push(`/my/wishlist?page=${page}`)}
                  >
                    이전 페이지
                  </Button>
                  <Button
                    disabled={!list.data.hasNext}
                    onClick={() => router.push(`/my/wishlist?page=${page + 2}`)}
                  >
                    다음 페이지
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </BuyerAccountScreen>
  );
}
