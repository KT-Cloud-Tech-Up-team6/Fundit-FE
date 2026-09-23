import Link from "next/link";
import { buyerCategories, getBuyerCategory } from "@/entities/category/model/category-mock";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";
import { Icon } from "@/shared/components/ui/icon";
import { PendingDestination } from "@/shared/components/ui/pending-destination";
import { SearchField } from "@/shared/components/ui/search-field";
import { CategoryBannerCarousel } from "./category-banner-carousel";
import styles from "./buyer-category-list.module.css";

export function BuyerCategoryList({ slug }: { slug: string }) {
  const selectedCategory = getBuyerCategory(slug);

  return (
    <div className="bg-layer-surface-default min-h-dvh w-full">
      <BuyerDesktopHeader />
      <div
        className={`${styles.screen} bg-layer-surface-default text-text-default mx-auto min-h-screen w-full pb-[calc(54px+env(safe-area-inset-bottom))] min-[1200px]:min-h-[calc(100dvh-70px)] min-[1200px]:max-w-300 min-[1200px]:pb-16`}
      >
        {/* 데스크톱 헤더에는 검색이 없으므로 /live와 같이 검색은 남기고 알림만 숨긴다. */}
        <header className="flex items-center gap-4 px-5 py-2 min-[1200px]:mx-auto min-[1200px]:w-full min-[1200px]:max-w-[614px] min-[1200px]:px-0 min-[1200px]:py-8">
          <form action="/search" role="search" className="min-w-0 flex-1">
            <SearchField
              size="md"
              aria-label="프로젝트 검색"
              name="q"
              placeholder="검색어를 입력해주세요"
            />
          </form>
          <PendingDestination
            label="알림함"
            className="flex h-10 w-6 shrink-0 items-center justify-center min-[1200px]:hidden"
          >
            <Icon name="bell" className="size-6" />
          </PendingDestination>
        </header>

        <main>
          <h1 className="sr-only">카테고리 탐색</h1>
          <section
            aria-label="프로모션 배너"
            className="px-5 py-1 min-[1200px]:mx-auto min-[1200px]:max-w-[833px]"
          >
            <CategoryBannerCarousel />
          </section>

          <div className="flex gap-0 px-5 pt-2 pb-8">
            <nav aria-label="카테고리 목록" className="w-25 shrink-0 min-[1200px]:w-50">
              <ul className="space-y-3">
                {buyerCategories.map((category) => {
                  const selected = category.slug === selectedCategory.slug;
                  return (
                    <li key={category.slug}>
                      <Link
                        href={`/categories/${category.slug}`}
                        replace
                        aria-current={selected ? "page" : undefined}
                        className={`${styles.categoryLink} block min-h-9 px-2 py-2 text-[14px] leading-5 ${selected ? "font-medium" : "font-normal"}`}
                      >
                        {category.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <section aria-labelledby="selected-category-title" className="min-w-0 flex-1">
              <div className="flex h-9 items-center justify-between pl-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {/* 디자인 시스템 line 아이콘(선 두께 1.3)을 대분류 slug 이름으로 둔다. 모르는 slug는
                      첫 카테고리로 보여 주므로 주소가 아니라 선택된 카테고리를 따른다. */}
                  <span
                    aria-hidden
                    className="size-5 shrink-0 bg-current"
                    style={{
                      maskImage: `url(/icons/buyer-category/${selectedCategory.slug}.svg)`,
                      maskSize: "contain",
                      maskRepeat: "no-repeat",
                    }}
                  />
                  <h2
                    id="selected-category-title"
                    className="truncate text-[16px] leading-6 font-semibold"
                  >
                    {selectedCategory.name}
                  </h2>
                </div>
                <PendingDestination
                  label={`${selectedCategory.name} 더보기`}
                  className="flex size-9 shrink-0 items-center justify-center"
                >
                  <Icon name="next" className="size-4" />
                </PendingDestination>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-x-2 gap-y-2 min-[1200px]:grid-cols-4 min-[1200px]:gap-x-4">
                {/* 소분류는 무조건 LIVE 홈으로 보낸다(#307, PM 결정). 소분류 결과 화면은 쓰지 않는다. */}
                {selectedCategory.subcategories.map((subcategory) => (
                  <li key={subcategory} className={`${styles.subcategory} min-w-0 border-b`}>
                    <Link href="/live" className="block min-w-0 truncate p-2 text-[14px] leading-5">
                      {subcategory}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </main>

        <BuyerBottomNavigation
          compact
          activeHref="/categories"
          aria-label="카테고리 화면 하단 메뉴"
          className="fixed inset-x-0 bottom-0 z-20 w-full min-[1200px]:hidden"
        />
      </div>
    </div>
  );
}
