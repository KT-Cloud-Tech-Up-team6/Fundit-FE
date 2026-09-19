import { CheckoutRoute } from "@/features/order-checkout/ui/checkout-route";
import { designRewards } from "@/features/reward-selection/model/reward-demo";
import { getProjectDemoConnection } from "@/features/buyer-live/model/live-demo";
import { resolveProjectDemo } from "@/features/buyer-project/model/project-demo";

export default async function CheckoutPage({ params }: PageProps<"/funding/[projectId]/checkout">) {
  const { projectId } = await params;
  const project = resolveProjectDemo(projectId, getProjectDemoConnection(projectId));
  return (
    <CheckoutRoute
      projectId={projectId}
      project={{ title: project.title, image: project.image }}
      rewards={designRewards()}
    />
  );
}
