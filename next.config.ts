import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* 소비자 핵심 플로우(Figma 1087:18097)는 `LIVE 탭 이동`에서 시작하고 홈 화면은 등장하지 않는다.
     구매자 프레임 40종에도 홈 원본이 없어 임의로 만들지 않고 설계상 진입점으로 보낸다.
     페이지에서 redirect()하면 정적 라우트라 1초 meta refresh가 되므로 라우팅 레벨에서 처리한다.
     홈 디자인이 확정되면 이 항목을 지우고 (buyer)/page.tsx를 되살린다.
     카테고리 소분류는 무조건 LIVE 홈으로 보낸다(#307, PM 결정). 예전 소분류 결과 주소로 직접 들어와도 같은 곳으로 넘긴다. */
  async redirects() {
    return [
      { source: "/", destination: "/live", permanent: false },
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
