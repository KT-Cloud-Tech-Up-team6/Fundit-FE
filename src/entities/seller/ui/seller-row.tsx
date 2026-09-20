import Image from "next/image";
import { Button } from "@/shared/components/ui/button";

export type SellerSummary = {
  id: string;
  name: string;
  followers: number;
  likes: number;
  live: boolean;
  avatar?: string;
};

export function SellerRow({
  seller,
  following,
  onFollow,
  followUnavailable = false,
}: {
  seller: Pick<SellerSummary, "id" | "name"> & Partial<SellerSummary>;
  following: boolean;
  onFollow: () => void;
  followUnavailable?: boolean;
}) {
  return (
    <article className="flex items-center justify-between gap-3 py-3" aria-label={seller.name}>
      <div className="flex min-w-0 items-center gap-2">
        <div
          className={`bg-border-default relative size-[46px] shrink-0 rounded-full ${seller.live ? "ring-border-primary-live ring-2" : ""}`}
          aria-hidden
        >
          {seller.avatar && (
            <Image
              src={seller.avatar}
              alt=""
              fill
              sizes="46px"
              className="rounded-full object-cover"
            />
          )}
          {seller.live && (
            <span className="bg-layer-surface-primary-live text-text-static-white absolute -top-1.5 left-2 rounded-full px-1 text-[11px] leading-[14px]">
              LIVE
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-body-emphasis truncate">{seller.name}</h2>
          <p className="text-caption-s flex flex-wrap items-center gap-1">
            {seller.followers != null && (
              <>
                <span className="text-text-disabled">팔로워</span>{" "}
                {(seller.followers + Number(following)).toLocaleString("ko-KR")}
              </>
            )}
            {seller.followers != null && seller.likes != null && <span aria-hidden>·</span>}
            {seller.likes != null && (
              <>
                <span
                  aria-label="좋아요"
                  className="inline-block size-4 bg-current [mask-image:url('/icons/buyer-search/heart.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
                />
                {seller.likes.toLocaleString("ko-KR")}
              </>
            )}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant={following ? "secondary" : "primary"}
        size="md"
        className="h-9 shrink-0 px-3 text-[12px]!"
        aria-label={`${seller.name} ${following ? "팔로우 해제" : "팔로우"}`}
        aria-pressed={followUnavailable ? undefined : following}
        disabled={followUnavailable}
        onClick={onFollow}
      >
        {following ? "팔로잉" : "팔로우"}
      </Button>
    </article>
  );
}
