import Link from "next/link";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { Icon } from "@/shared/components/ui/icon";

const menuGroups = [
  {
    title: "펀딩내역",
    items: [
      { label: "참여 프로젝트", href: "/my/fundings" },
      { label: "취소/환불내역", href: "/my/refunds" },
      { label: "제작/배송 현황", href: "/my/fundings" },
    ],
  },
  {
    title: "나의 활동",
    items: [
      { label: "관심 목록", href: "/my/wishlist" },
      { label: "알림함", href: "/my/notifications" },
    ],
  },
  {
    title: "고객센터",
    items: [
      { label: "1:1 문의", href: "/my/support/inquiries" },
      { label: "FAQ", href: "/support/faq" },
      { label: "공지사항", href: "/support/notices" },
    ],
  },
  {
    title: "설정",
    items: [
      { label: "맞춤 정보 설정", href: "/my/preferences" },
      { label: "알림 설정", href: "/my/notifications/settings" },
      { label: "회원 정보 관리", href: "/my/profile" },
      { label: "화면 모드", href: "/my/settings" },
    ],
  },
];

export function BuyerMyPage() {
  return (
    <BuyerAccountScreen title="마이 페이지" backHref="/">
      <div className="px-5 pb-8">
        <div className="flex items-center justify-between gap-2 py-3">
          <Link
            href="/my/profile"
            className="flex min-w-0 items-center gap-2"
            aria-label="내 프로필 보기"
          >
            <span aria-hidden className="bg-border-default size-[46px] shrink-0 rounded-full" />
            <div className="min-w-0">
              <p className="text-title-m flex items-center gap-1 leading-7 font-bold">
                <span className="truncate">사용자 닉네임</span>
                <Icon name="next" className="size-4 shrink-0" />
              </p>
              <p className="text-text-disabled mt-1 truncate text-[13px]">12*****@gmail.com</p>
            </div>
          </Link>
          <Link
            href="/seller/projects"
            className="bg-text-default text-body-s text-text-static-white flex shrink-0 items-center gap-2 rounded-xs px-4 py-2"
            aria-label="판매자 모드로 이동"
          >
            판매자
            <Icon name="swap" className="size-4" />
          </Link>
        </div>
        <section aria-label="회원 등급" className="mt-3 space-y-2">
          <div className="border-border-default rounded-xs border px-4 py-3">
            <h2 className="text-body-m mb-2 flex items-center gap-2 font-semibold">
              <span
                aria-hidden
                className="size-5 bg-current [mask-image:url('/icons/buyer-mypage/wave.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
              />
              Ripple(잔물결)
            </h2>
            <p className="text-body-s leading-5">
              성립 펀딩 2건 이상 또는 누적 15만원 이상일 시<br />
              Current(해류) 달성
            </p>
          </div>
          <div className="bg-layer-surface-disabled text-label-m rounded-xs px-3 py-2 leading-[1.5]">
            <h3 className="mb-1 flex items-center gap-1 font-medium">
              <span
                aria-hidden
                className="size-3.5 bg-current [mask-image:url('/icons/buyer-mypage/benefits.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
              />
              Current(해류) 혜택
            </h3>
            <p>등급 전용 쿠폰(분기) 3천원, 등급 배지(프로필·서포터 탭 노출)</p>
          </div>
        </section>
        <div className="divide-layer-surface-disabled mt-8 divide-y">
          {menuGroups.map((group) => (
            <nav key={group.title} aria-label={group.title} className="py-6 first:pt-0 last:pb-0">
              <h2 className="text-body-s mb-3 font-medium">{group.title}</h2>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {group.items.map((item) => (
                  <Link key={item.label} href={item.href} className="text-body-m py-2 font-medium">
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          ))}
        </div>
      </div>
      <BuyerBottomNavigation activeHref="/my" className="sticky bottom-0 mt-auto" />
    </BuyerAccountScreen>
  );
}
