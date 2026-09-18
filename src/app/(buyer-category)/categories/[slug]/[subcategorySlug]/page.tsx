import { getBuyerCategory } from "@/entities/category/model/category-mock";
import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function CategorySubcategoryPage({
  params,
}: PageProps<"/categories/[slug]/[subcategorySlug]">) {
  const { slug, subcategorySlug } = await params;
  const category = getBuyerCategory(slug);

  return (
    <PagePlaceholder
      eyebrow="Buyer · Explore"
      title={`${category.name} · 소분류 결과`}
      description="선택한 소분류에 해당하는 프로젝트를 필터와 정렬 기준으로 탐색합니다."
      screenIds="B-02 하위"
      access="public"
      sections={["필터·정렬", "프로젝트 그리드"]}
    >
      <p className="text-body-s text-text-secondary">소분류: {subcategorySlug} (목업)</p>
    </PagePlaceholder>
  );
}
