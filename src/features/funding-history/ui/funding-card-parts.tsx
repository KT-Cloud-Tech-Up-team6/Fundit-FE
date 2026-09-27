import { Button } from "@/shared/components/ui/button";
import type { FundingAction } from "../model/funding-history";

/** 썸네일이 없으면(project-service 조회 실패) 같은 크기의 빈 자리만 둔다. */
export function FundingThumbnail({ src, className }: { src: string; className: string }) {
  if (!src)
    return <div aria-hidden className={`bg-layer-surface-disabled rounded-xs ${className}`} />;
  /* 서버 썸네일 주소의 호스트가 정해져 있지 않아 next/image 대신 img를 쓴다. */
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`rounded-xs object-cover ${className}`} />;
}

/** 원본 button color=secondary·size=M(높이 40, Label/Semibold_14). 기간이 지난 반품·교환은
    color=disabled(#CDCED4) 안내 버튼 하나로 그린다(정리표 2323:54023). */
export function FundingActionButtons({ actions }: { actions: FundingAction[] }) {
  if (!actions.length) return null;
  return (
    <div className="flex items-center gap-2">
      {actions.map((action) =>
        action.href ? (
          <Button
            key={action.label}
            href={action.href}
            variant="secondary"
            appearance="cta"
            size="md"
            className="text-label-l! min-w-0 flex-1"
          >
            {action.label}
          </Button>
        ) : (
          <Button
            key={action.label}
            variant="secondary"
            appearance="cta"
            size="md"
            disabled
            className="text-label-l! min-w-0 flex-1 disabled:bg-[#cdced4]!"
          >
            {action.label}
          </Button>
        ),
      )}
    </div>
  );
}
