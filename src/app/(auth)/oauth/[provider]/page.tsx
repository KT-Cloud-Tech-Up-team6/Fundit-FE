import { notFound } from "next/navigation";
import { Suspense } from "react";

import { parseProviderSlug } from "@/features/auth/model/oauth-authorize";
import { OAuthCallbackFlow } from "@/features/auth/ui/oauth-callback-flow";

export default async function OAuthCallbackPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const provider = parseProviderSlug((await params).provider);
  if (!provider) notFound();

  return (
    <Suspense fallback={<p role="status">소셜 로그인 결과를 확인하는 중입니다.</p>}>
      <OAuthCallbackFlow provider={provider} />
    </Suspense>
  );
}
