import Image from "next/image";
import Link from "next/link";
import type { SellerLive } from "@/entities/live/model/seller-live";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";

export type { SellerLive } from "@/entities/live/model/seller-live";

/**
 * FL_S_PR_LIST_1 `project_card_item`(1230:19046)과 같은 골격이다 —
 * 82px 썸네일 + 정보 그룹 + 우측 뱃지/관리 버튼.
 *
 * 프로젝트 전용 지표(모금액·목표액·진행률 바·목표 달성 뱃지·참여자 수)는 넣지 않는다.
 * LiveSummaryResponse에 그런 값이 없다. 자리만 만들면 화면이 없는 사실을 말하게 된다.
 */
export function SellerLiveCard(live: SellerLive) {
  return (
    <article className="border-border-default flex min-w-0 flex-col gap-4 border-b p-5 md:h-[136px] md:flex-row md:items-start md:justify-between md:gap-6">
      <div className="flex min-w-0 flex-1 gap-4 md:gap-6">
        <div className="bg-layer-bg size-[82px] shrink-0 overflow-hidden rounded-xs">
          {live.thumbnail && (
            <Image
              src={live.thumbnail}
              alt=""
              width={82}
              height={82}
              className="size-full object-cover"
              unoptimized={/^https?:\/\//.test(live.thumbnail)}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col md:max-w-[268px]">
          {/* 계약에 제목이 없다. introText가 유일한 문구이고 임시저장 LIVE는 그것도
              비어 있을 수 있어, 가짜 제목 대신 비어 있다는 사실을 그대로 적는다. */}
          <h3 className="text-body-strong truncate">
            <Link href={live.manageHref} className="hover:underline">
              {live.introText || (
                <span className="text-text-secondary font-normal">소개 문구 없음</span>
              )}
            </Link>
          </h3>
          <dl className="text-caption-m text-text-secondary mt-1">
            <div className="flex gap-1">
              <dt>방송 예정</dt>
              <dd>{live.scheduledStartAtLabel}</dd>
            </div>
            <div className="flex gap-1">
              <dt>생성일</dt>
              <dd>{live.createdAtLabel}</dd>
            </div>
          </dl>
          {/* LiveSummaryResponse의 유일한 지표다. FL_S_PR_LIST_1 카드의 메타 행이
              아이콘 + 수치(사람 아이콘 + "132명")라 같은 형태로 맞춘다. 하트는 시청
              화면 좋아요가 쓰는 자산이라 같은 뜻으로 읽힌다. Icon은 aria-hidden이라
              수치만 남지 않게 라벨을 따로 읽힌다. */}
          <p className="text-caption-m text-text-secondary mt-1 flex items-center gap-1">
            <Icon name="heart" className="size-3.5 shrink-0" />
            <span className="sr-only">좋아요</span>
            {live.likeCount.toLocaleString("ko-KR")}
          </p>
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center justify-between gap-2 md:h-[96px] md:w-34 md:flex-col md:items-end md:justify-between">
        <Badge variant={live.statusVariant} size="md" shape="rounded">
          {live.statusLabel}
        </Badge>
        <Button
          href={live.manageHref}
          variant="secondary"
          size="md"
          className="text-caption-m! h-9! w-28 shrink-0 font-medium! md:w-full"
        >
          관리
        </Button>
      </div>
    </article>
  );
}
