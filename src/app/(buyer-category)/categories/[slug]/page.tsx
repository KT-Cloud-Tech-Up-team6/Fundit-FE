import { BuyerCategoryApi } from "@/features/buyer-category/ui/buyer-category-api";

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  return <BuyerCategoryApi slug={slug} />;
}
