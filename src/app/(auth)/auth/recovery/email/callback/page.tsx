import { RecoveryFlow } from "@/features/auth/ui/recovery-flow";

export default async function EmailRecoveryCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ identityVerificationId?: string; code?: string }>;
}) {
  const params = await searchParams;
  return (
    <RecoveryFlow
      initialView="identity-verifying"
      callback={{
        identityVerificationId:
          typeof params.identityVerificationId === "string" ? params.identityVerificationId : "",
        code: typeof params.code === "string" ? params.code : null,
      }}
    />
  );
}
