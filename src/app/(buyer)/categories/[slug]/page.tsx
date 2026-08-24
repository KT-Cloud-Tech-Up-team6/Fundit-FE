import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  return (
    <PagePlaceholder
      eyebrow="Buyer · Explore"
      title={`카테고리 · ${slug}`}
      description="선택한 카테고리의 프로젝트를 필터와 정렬 기준으로 탐색합니다."
      screenIds="B-02"
      access="public"
      sections={["하위 카테고리", "필터·정렬", "프로젝트 그리드"]}
    />
  );
}
