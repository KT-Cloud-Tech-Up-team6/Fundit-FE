import { BuyerCategoryList } from "@/features/buyer-category/ui/buyer-category-list";

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  return <BuyerCategoryList slug={slug} />;
}
