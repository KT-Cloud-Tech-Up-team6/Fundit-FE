import { SellerLiveList } from "@/features/seller-lives/ui/seller-live-list";
import { sellerLiveTabs, type SellerLiveTab } from "@/entities/live/model/seller-live";

type SearchParam = string | string[] | undefined;

function getSingleSearchParam(value: SearchParam) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SellerLiveStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: SearchParam; search?: SearchParam; page?: SearchParam }>;
}) {
  const params = await searchParams;
  const statusParam = getSingleSearchParam(params.status);
  const searchParam = getSingleSearchParam(params.search);
  const pageParam = getSingleSearchParam(params.page);
  const status = sellerLiveTabs.includes(statusParam as SellerLiveTab)
    ? (statusParam as SellerLiveTab)
    : "active";
  const search = searchParam?.trim() ?? "";
  const parsedPage = Number(pageParam);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return <SellerLiveList status={status} search={search} page={page} />;
}
