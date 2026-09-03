import { redirect } from "next/navigation";

type RecoveryPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function RecoveryPage({ searchParams }: RecoveryPageProps) {
  const { view } = await searchParams;

  redirect(view === "password" ? "/auth/recovery/password" : "/auth/recovery/email");
}
