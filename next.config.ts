import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* 카테고리 소분류는 무조건 LIVE 홈으로 보낸다(#307, PM 결정). 예전 소분류 결과 주소로 직접 들어와도 같은 곳으로 넘긴다.
     `/`는 홈 화면((buyer-home)/page.tsx, #367)이라 더 이상 `/live`로 보내지 않는다. */
  async redirects() {
    return [
      { source: "/categories/:slug/:subcategorySlug", destination: "/live", permanent: false },
    ];
  },
  /* 로컬에서 BE(gateway)를 같은 origin으로 프록시해 CORS·SameSite 쿠키 문제를 피한다.
     API_PROXY_TARGET이 없으면 꺼진다(운영 영향 없음). 사용 시 NEXT_PUBLIC_API_BASE_URL은 비워 둔다. */
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    return target ? [{ source: "/api/:path*", destination: `${target}/api/:path*` }] : [];
  },
};

export default nextConfig;
