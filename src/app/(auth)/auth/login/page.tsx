import { LoginFlow } from "@/features/auth/ui/login-flow";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  return <LoginFlow returnTo={returnTo} />;
}
