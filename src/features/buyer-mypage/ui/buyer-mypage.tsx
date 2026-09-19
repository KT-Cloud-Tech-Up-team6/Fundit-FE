import Link from "next/link";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { Icon } from "@/shared/components/ui/icon";

const menuGroups = [
  {
    title: "펀딩 내역",
    items: [
      { label: "참여 프로젝트", href: "/my/fundings" },
      { label: "취소/환불/교환 내역", href: "/my/refunds" },
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
    <BuyerAccountScreen
      title="마이페이지"
      backHref="/"
      className="flex w-full flex-col max-[1200px]:max-w-none"
    >
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between gap-2 py-3">
          <Link
            href="/my/profile"
            className="flex min-w-0 items-center gap-2"
            aria-label="내 프로필 보기"
          >
            <span
              aria-hidden
              className="bg-layer-surface-disabled flex size-[46px] shrink-0 items-center justify-center rounded-full"
            >
              <span className="size-6 bg-current [mask-image:url('/icons/buyer-account/a371f.svg')] [mask-size:contain]" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[20px] leading-7 font-semibold">
                <span className="truncate">홍길동</span>
                <Icon name="next" className="size-4 shrink-0" />
              </p>
              <p className="text-caption-s text-text-disabled mt-1 truncate font-medium">
                12*****@gmail.com
              </p>
            </div>
          </Link>
          <Link
            href="/seller/projects"
            className="bg-layer-surface-primary text-body-s text-text-inverse flex h-9 shrink-0 items-center gap-1 rounded-xs px-2 leading-[1.42] font-medium"
            aria-label="판매자 모드로 이동"
          >
            판매자 전환
            <span
              aria-hidden
              className="size-4 bg-current [mask-image:url('/icons/buyer-account/ab25c.svg')] [mask-size:contain]"
            />
          </Link>
        </div>
        <section aria-label="회원 등급" className="mt-3 space-y-2">
          <div className="border-border-default rounded-xs border px-4 py-3">
            <h2 className="text-body-strong mb-2 flex items-center gap-2">
              <span
                aria-hidden
                className="size-5 bg-current [mask-image:url('/icons/buyer-account/01cd2.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
              />
              Ripple(잔물결)
            </h2>
            <p className="text-[14px] leading-5">
              <span className="font-medium">성립 펀딩 2건 이상</span> 또는{" "}
              <span className="font-medium">누적 15만원 이상</span>일 시<br />
              <span className="font-medium">Current(해류)</span> 달성
            </p>
          </div>
          <div className="bg-layer-surface-disabled rounded-xs px-3 py-2">
            <h3 className="text-caption-strong mb-1 flex items-center gap-1">
              <span
                aria-hidden
                className="size-3.5 bg-current [mask-image:url('/icons/buyer-account/9d49f.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
              />
              Current(해류) 혜택
            </h3>
            <p className="text-caption-s font-medium">
              등급 전용 쿠폰(분기) 3천원, 등급 배지(프로필·서포터 탭 노출)
            </p>
          </div>
        </section>
        <div className="mt-8 space-y-6">
          {menuGroups.map((group) => (
            <nav
              key={group.title}
              aria-label={group.title}
              className="border-border-default border-b pb-2 last:border-0 last:pb-0"
            >
              <h2 className="text-text-disabled mb-1 text-[14px] leading-5">{group.title}</h2>
              <div className="grid grid-cols-2 gap-x-3">
                {group.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`text-body-m flex items-center ${group.title === "설정" ? "min-h-10" : "min-h-12"}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          ))}
        </div>
      </div>
      <BuyerBottomNavigation compact activeHref="/my" className="sticky bottom-0 mt-auto" />
    </BuyerAccountScreen>
  );
}
