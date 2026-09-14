import Link from "next/link";
import {
  buyerCategories,
  getBuyerCategory,
} from "@/features/buyer-category/model/buyer-category-mock";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { Icon } from "@/shared/components/ui/icon";
import { SearchField } from "@/shared/components/ui/search-field";
import { CategoryBannerCarousel } from "./category-banner-carousel";
import styles from "./buyer-category-list.module.css";

export function BuyerCategoryList({ slug }: { slug: string }) {
  const selectedCategory = getBuyerCategory(slug);

  return (
    <div
      className={`${styles.screen} bg-layer-surface-default text-text-default mx-auto min-h-screen w-full max-w-[390px] pb-[calc(76px+env(safe-area-inset-bottom))]`}
    >
      <header className="flex items-center gap-4 px-5 py-2">
        <div role="search" className="min-w-0 flex-1">
          <SearchField
            size="md"
            aria-label="프로젝트 검색"
            placeholder="place holder"
            className={styles.search}
          />
        </div>
        <Link
          href="/my/notifications"
          aria-label="알림함"
          className="flex h-10 w-6 shrink-0 items-center justify-center"
        >
          <Icon name="bell" className="h-3.5 w-6" />
        </Link>
      </header>

      <main>
        <h1 className="sr-only">카테고리 탐색</h1>
        <section aria-label="프로모션 배너" className="px-5">
          <CategoryBannerCarousel />
        </section>

        <div className="flex gap-0 px-5 pt-4 pb-8">
          <nav aria-label="카테고리 목록" className="w-25 shrink-0">
            <ul>
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
            <div className="flex h-11 items-center justify-between pl-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span aria-hidden className={`${styles.categoryIcon} size-6 shrink-0`} />
                <h2
                  id="selected-category-title"
                  className="truncate text-[16px] leading-6 font-semibold"
                >
                  {selectedCategory.name}
                </h2>
              </div>
              <button
                type="button"
                disabled
                aria-label={`${selectedCategory.name} 더보기 · 화면 미정`}
                className="flex size-9 shrink-0 cursor-not-allowed items-center justify-center"
              >
                <Icon name="next" className="size-4" />
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-x-2">
              {selectedCategory.subcategories.map((subcategory) => (
                <li key={subcategory.slug} className={`${styles.subcategory} min-w-0 border-b`}>
                  <Link
                    href={`/categories/${selectedCategory.slug}/${subcategory.slug}`}
                    className="block min-w-0 truncate p-2 text-[14px] leading-5"
                  >
                    {subcategory.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <BuyerBottomNavigation
        activeHref="/categories"
        aria-label="카테고리 화면 하단 메뉴"
        className="fixed bottom-0 left-1/2 z-20 w-full max-w-[390px] -translate-x-1/2"
      />
    </div>
  );
}
