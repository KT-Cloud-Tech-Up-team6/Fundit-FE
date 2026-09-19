import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* 소비자 핵심 플로우(Figma 1087:18097)는 `LIVE 탭 이동`에서 시작하고 홈 화면은 등장하지 않는다.
     구매자 프레임 40종에도 홈 원본이 없어 임의로 만들지 않고 설계상 진입점으로 보낸다.
     페이지에서 redirect()하면 정적 라우트라 1초 meta refresh가 되므로 라우팅 레벨에서 처리한다.
     홈 디자인이 확정되면 이 항목을 지우고 (buyer)/page.tsx를 되살린다. */
  async redirects() {
    return [{ source: "/", destination: "/live", permanent: false }];
  },
};

export default nextConfig;
