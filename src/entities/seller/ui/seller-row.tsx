import { secondaryButtonClasses } from "@/shared/components/ui/button";

export type SellerSummary = {
  id: string;
  name: string;
  followers: number;
  likes: number;
  live: boolean;
};

export function SellerRow({
  seller,
  following,
  onFollow,
}: {
  seller: SellerSummary;
  following: boolean;
  onFollow: () => void;
}) {
  return (
    <article className="flex items-center justify-between gap-3 py-3" aria-label={seller.name}>
      <div className="flex min-w-0 items-center gap-2">
        <div className="bg-border-default relative size-11 shrink-0 rounded-full" aria-hidden>
          {seller.live && (
            <span className="bg-text-disabled text-text-inverse absolute -top-1 left-2 rounded-xs px-1 text-[11px]">
              LIVE
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-body-emphasis truncate">{seller.name}</h2>
          <p className="text-caption-s flex flex-wrap items-center gap-1">
            <span className="text-text-disabled">팔로워</span>{" "}
            {(seller.followers + Number(following)).toLocaleString("ko-KR")}
            <span aria-hidden>·</span>
            <span
              aria-label="좋아요"
              className="inline-block size-4 bg-current [mask-image:url('/icons/buyer-search/heart.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
            />
            {seller.likes.toLocaleString("ko-KR")}
          </p>
        </div>
      </div>
      <button
        type="button"
        className={`${secondaryButtonClasses} h-9 shrink-0 px-3 text-[12px]`}
        aria-label={`${seller.name} ${following ? "팔로우 해제" : "팔로우"}`}
        aria-pressed={following}
        onClick={onFollow}
      >
        {following ? "팔로잉" : "팔로우"}
      </button>
    </article>
  );
}
