import { CheckoutRoute } from "@/features/order-checkout/ui/checkout-route";
import { designRewards } from "@/features/reward-selection/model/reward-demo";
import { getProjectDemoConnection } from "@/features/buyer-live/model/live-demo";
import { projectDemo } from "@/features/buyer-project/model/project-demo";
import { projectSearchDemo } from "@/entities/project/model/project-search-demo";

export default async function CheckoutPage({ params }: PageProps<"/funding/[projectId]/checkout">) {
  const { projectId } = await params;
  const project =
    getProjectDemoConnection(projectId)?.data ??
    projectSearchDemo.find((item) => item.id === projectId) ??
    projectDemo;
  return (
    <CheckoutRoute
      projectId={projectId}
      project={{ title: project.title, image: project.image }}
      rewards={designRewards()}
    />
  );
}
