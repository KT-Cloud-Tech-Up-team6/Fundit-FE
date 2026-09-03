export const buyerNavigation = [
  { href: "/", label: "홈" },
  { href: "/live", label: "LIVE" },
  { href: "/my", label: "마이" },
] as const;

export const sellerNavigation = [
  { href: "/seller/projects", label: "내 프로젝트", icon: "archive" },
  { href: "/seller/live", label: "LIVE 스튜디오", icon: "live" },
] as const;
