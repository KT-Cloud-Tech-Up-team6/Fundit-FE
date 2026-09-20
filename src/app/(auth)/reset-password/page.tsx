import type { Metadata } from "next";
import { PasswordUpdateFlow } from "@/features/auth/ui/password-update-flow";

export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <PasswordUpdateFlow mode="reset" token={typeof token === "string" ? token : ""} />;
}
