import { RecoveryFlow } from "@/features/auth/ui/recovery-flow";

type RecoveryPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function RecoveryPage({ searchParams }: RecoveryPageProps) {
  const { view } = await searchParams;

  return <RecoveryFlow initialView={view === "password" ? "password-form" : "email-form"} />;
}
