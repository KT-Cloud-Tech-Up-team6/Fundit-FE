import Image from "next/image";
import { EmptyState } from "@/shared/components/ui/empty-state";

/* 준비중 프로젝트는 펀딩이 시작되지 않아 펀딩 관리 화면 대신 보여 준다(PM 결정 2026-09-23).
   PM 요청대로 제작·배송의 잠긴 단계 안내(fulfillment-board)와 같은 그래픽 + 문구 구성이며 버튼은 없다. */
export function FundingEmptyState() {
  return (
    <div className="flex h-[380px] items-center justify-center p-4">
      <EmptyState
        className="w-[390px] max-w-full"
        graphic={
          <Image
            src="/images/shared/island.svg"
            alt=""
            width={112}
            height={112}
            className="size-28"
          />
        }
        message="펀딩 내역이 없습니다"
      />
    </div>
  );
}
