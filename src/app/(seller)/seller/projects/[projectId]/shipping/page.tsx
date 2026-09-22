import { SellerFulfillmentApi } from "@/features/fulfillment-tracking/ui/seller-fulfillment-api";
import { ProjectSidebar, projectManageTabs } from "@/entities/project/ui/project-sidebar";
import { ShippingBoard } from "@/features/shipping-info/ui/shipping-board";
import { isPublicUuid } from "@/shared/lib/public-uuid";

export default async function ShippingPage({
  params,
}: PageProps<"/seller/projects/[projectId]/shipping">) {
  const { projectId } = await params;
  if (isPublicUuid(projectId)) return <SellerFulfillmentApi projectId={projectId} shipping />;

  return (
    <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:gap-6">
      <ProjectSidebar
        activeTab="fulfillment"
        backHref={`/seller/projects/${projectId}?tab=fulfillment`}
        backLabel="제작 · 배송"
        projectId={projectId}
        projectName={`프로젝트 이름이 들어갈 자리 (${projectId})`}
        tabs={projectManageTabs}
        className="lg:mt-9"
      />
      <ShippingBoard />
    </div>
  );
}
