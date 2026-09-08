import { ProjectSidebar, projectManageTabs } from "@/entities/project/ui/project-sidebar";
import { ShippingBoard } from "@/features/shipping-info/ui/shipping-board";

export default async function ShippingPage({
  params,
}: PageProps<"/seller/projects/[projectId]/shipping">) {
  const { projectId } = await params;

  return (
    <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:gap-6">
      {/* 발송정보는 제작·배송의 하위 화면이라 사이드바 선택은 `제작 · 배송`에 남고
          뒤로가기만 그 탭을 가리킨다(Figma FL_S_DL_SHIP). */}
      <ProjectSidebar
        activeTab="fulfillment"
        backHref={`/seller/projects/${projectId}?tab=fulfillment`}
        backLabel="제작 · 배송"
        projectId={projectId}
        projectName={`프로젝트 이름이 들어갈 자리 (${projectId})`}
        tabs={projectManageTabs}
      />
      <ShippingBoard />
    </div>
  );
}
