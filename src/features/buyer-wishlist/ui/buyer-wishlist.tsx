"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SellerRow } from "@/entities/seller/ui/seller-row";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { Tab, TabList } from "@/shared/components/ui/tab";
import { wishlistProjects, wishlistSellers } from "../model/wishlist-demo";

export function BuyerWishlistRoute() {
  const params = useSearchParams();
  return (
    <BuyerWishlist
      tab={params.get("tab") === "sellers" ? "sellers" : "projects"}
      onTabChange={(tab) =>
        window.history.pushState(
          null,
          "",
          tab === "sellers" ? "/my/wishlist?tab=sellers" : "/my/wishlist",
        )
      }
    />
  );
}

export function BuyerWishlist({
  tab,
  onTabChange,
  initialEmpty = false,
}: {
  tab: "projects" | "sellers";
  onTabChange: (tab: "projects" | "sellers") => void;
  initialEmpty?: boolean;
}) {
  const [projects, setProjects] = useState(initialEmpty ? [] : wishlistProjects);
  const [sellers, setSellers] = useState(initialEmpty ? [] : wishlistSellers);
  const count = tab === "projects" ? projects.length : sellers.length;
  return (
    <BuyerAccountScreen title="관심 목록">
      <TabList
        aria-label="관심 목록 종류"
        selectedIndex={tab === "projects" ? 0 : 1}
        onSelectedIndexChange={(index) => onTabChange(index === 0 ? "projects" : "sellers")}
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
        aria-labelledby={`wishlist-${tab}`}
        className="px-5 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))]"
      >
        <p role="status" className="text-body-s mb-3 font-medium">
          총 {count}개
        </p>
        {count === 0 ? (
          <p className="text-body-s py-24 text-center">
            {tab === "projects" ? "찜한 프로젝트가 없습니다." : "팔로우한 판매자가 없습니다."}
          </p>
        ) : tab === "projects" ? (
          <div className="space-y-3">
            {projects.map((project, index) => (
              <Fragment key={project.id}>
                <article aria-label={project.title} className="flex gap-3">
                  <Link
                    href={`/projects/${project.id}`}
                    aria-label={`${project.title} 상세 보기`}
                    className="bg-layer-surface-disabled flex aspect-[4/3] w-[39%] shrink-0 items-center justify-center rounded-xs"
                  >
                    {project.closed && (
                      <span className="bg-border-default text-label-m rounded-xs px-3 py-1">
                        종료
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1 pt-1">
                    <Link
                      href={`/projects/${project.id}`}
                      className={`block ${project.closed ? "text-text-disabled" : ""}`}
                    >
                      <p className="text-label-m mb-1">{project.seller}</p>
                      <h2 className="text-body-s line-clamp-2 leading-5 font-medium">
                        {project.title}
                      </h2>
                    </Link>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <p
                        className={`text-body-m font-semibold ${project.closed ? "text-text-disabled" : ""}`}
                      >
                        {project.progress.toLocaleString("ko-KR")}%달성
                      </p>
                      <button
                        type="button"
                        aria-label={`${project.id} 찜 해제`}
                        className="bg-text-default text-text-static-white flex size-[30px] shrink-0 items-center justify-center rounded-full"
                        onClick={() =>
                          setProjects((items) => items.filter((item) => item.id !== project.id))
                        }
                      >
                        <span
                          aria-hidden
                          className="size-4 bg-current [mask-image:url('/icons/buyer-wishlist/heart.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
                        />
                      </button>
                    </div>
                  </div>
                </article>
                {index === 3 && <Advertisement />}
              </Fragment>
            ))}
          </div>
        ) : (
          <div>
            {sellers.map((seller, index) => (
              <Fragment key={seller.id}>
                <SellerRow
                  seller={seller}
                  following
                  onFollow={() =>
                    setSellers((items) => items.filter((item) => item.id !== seller.id))
                  }
                />
                {index === 4 && <Advertisement />}
              </Fragment>
            ))}
          </div>
        )}
      </section>
    </BuyerAccountScreen>
  );
}

function Advertisement() {
  return (
    <aside
      aria-label="광고 영역"
      className="bg-layer-surface-disabled text-body-s my-5 flex h-[88px] items-center justify-center rounded-xs"
    >
      광고
    </aside>
  );
}
