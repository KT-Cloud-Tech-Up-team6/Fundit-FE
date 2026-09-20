import { queryOptions } from "@tanstack/react-query";
import { findFundingProject } from "../../../entities/fulfillment/api/fulfillment-api";

export function fundingProjectQuery(memberId: string, fundingId: string) {
  return queryOptions({
    queryKey: ["funding-project", memberId, fundingId],
    queryFn: ({ signal }) => findFundingProject(fundingId, signal),
    staleTime: 5 * 60 * 1000,
  });
}
