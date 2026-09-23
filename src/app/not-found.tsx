import { ErrorState } from "@/shared/components/ui/error-state";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col">
      <ErrorState status="notFound" action={{ href: "/" }} />
    </main>
  );
}
