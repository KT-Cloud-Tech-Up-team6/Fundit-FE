import { ErrorState } from "@/shared/components/ui/error-state";

export default function SellerNotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <ErrorState status="notFound" action={{ href: "/seller/projects" }} />
    </main>
  );
}
