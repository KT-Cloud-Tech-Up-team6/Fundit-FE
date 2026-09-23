import { ErrorState } from "@/shared/components/ui/error-state";

export default function SellerNotFound() {
  return <ErrorState status="notFound" action={{ href: "/seller/projects" }} />;
}
