import { SellerProjectList } from "@/features/seller-projects/ui/seller-project-list";
import {
  sellerProjectStatuses,
  type SellerProjectStatus,
} from "@/entities/project/model/seller-project";

type Status = SellerProjectStatus;
type SearchParam = string | string[] | undefined;

function getSingleSearchParam(value: SearchParam) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SellerProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: SearchParam;
    page?: SearchParam;
    search?: SearchParam;
  }>;
}) {
  const params = await searchParams;
  const statusParam = getSingleSearchParam(params.status);
  const searchParam = getSingleSearchParam(params.search);
  const pageParam = getSingleSearchParam(params.page);
  const status = sellerProjectStatuses.includes(statusParam as Status)
    ? (statusParam as Status)
    : "active";
  const search = searchParam?.trim() ?? "";
  const parsedPage = Number(pageParam);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  return <SellerProjectList status={status} search={search} page={page} />;
}
