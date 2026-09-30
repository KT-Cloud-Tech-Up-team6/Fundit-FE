import { Suspense } from "react";

import { SocialLinkFlow } from "@/features/auth/ui/social-link-flow";

export default function SocialLinkPage() {
  return (
    <Suspense fallback={<p role="status">소셜 계정 연동 정보를 확인하는 중입니다.</p>}>
      <SocialLinkFlow />
    </Suspense>
  );
}
