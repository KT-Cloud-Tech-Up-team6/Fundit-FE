"use client";

import Image from "next/image";
import { Fragment, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SellerRow } from "@/entities/seller/ui/seller-row";
import { ProjectRow } from "@/entities/project/ui/project-row";
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
    <BuyerAccountScreen title="관심 목록" className="w-full">
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
        <p role="status" className="text-text-disabled text-body-s mb-3">
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
                <ProjectRow project={project} thumbnailClassName="w-[41.14%]">
                  <button
                    type="button"
                    aria-label={`${project.title} 찜 해제`}
                    className="bg-layer-surface-primary text-text-inverse flex size-9 shrink-0 items-center justify-center rounded-full"
                    onClick={() =>
                      setProjects((items) => items.filter((item) => item.id !== project.id))
                    }
                  >
                    <span
                      aria-hidden
                      className="size-4 bg-current [mask-image:url('/icons/buyer-account/heart.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
                    />
                  </button>
                </ProjectRow>
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
                {index === 5 && <Advertisement />}
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
    <aside aria-label="광고 영역" className="relative my-5 h-[88px] overflow-hidden rounded-xs">
      <Image
        src="/images/buyer-category/promotion.png"
        alt="벨로라 건강 음료 프로모션"
        fill
        sizes="350px"
        className="object-cover object-top"
      />
    </aside>
  );
}
