import { Suspense } from "react";
import { IdentityVerificationCallbackFlow } from "@/features/auth/ui/identity-verification-callback-flow";

export default function IdentityVerificationCallbackPage() {
  return (
    <Suspense fallback={<p role="status">본인인증 결과를 확인하는 중입니다.</p>}>
      <IdentityVerificationCallbackFlow />
    </Suspense>
  );
}
