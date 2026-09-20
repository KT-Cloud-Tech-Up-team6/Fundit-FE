import { BuyerCategoryApi } from "@/features/buyer-category/ui/buyer-category-api";

export default async function CategorySubcategoryPage({
  params,
}: PageProps<"/categories/[slug]/[subcategorySlug]">) {
  const { slug, subcategorySlug } = await params;
  return <BuyerCategoryApi slug={slug} minor={subcategorySlug} />;
}
