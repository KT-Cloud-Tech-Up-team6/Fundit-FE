export const sellerProjectStatuses = ["active", "draft", "closed"] as const;

export type SellerProjectStatus = (typeof sellerProjectStatuses)[number];

export type SellerProjectBadge = {
  label: string;
  variant: "warning" | "success" | "caution" | "neutral";
};

type SellerProjectBase = {
  id: string;
  title: string;
  thumbnail: string;
  badges: readonly SellerProjectBadge[];
};

export type SellerProject = SellerProjectBase &
  (
    | {
        status: "draft";
        draftPhaseLabel: string;
      }
    | {
        status: "active" | "closed";
        category: string;
        period: string;
        participantCount: number;
        currentAmount: number;
        goalAmount: number;
      }
  );

export type SellerProjectListQuery = {
  page?: number;
  search?: string;
  status: SellerProjectStatus;
};

export type SellerProjectListResult = {
  items: SellerProject[];
  page: number;
  pageSize: number;
  statusCounts: Record<SellerProjectStatus, number>;
  totalItems: number;
  totalPages: number;
};
