import Image from "next/image";
import Link from "next/link";
import { formatWon } from "@/features/reward-selection/model/reward-demo";
import type { LiveProduct } from "../model/room-demo";

/* 시청·다시보기 상품 카드의 본문(Figma 1408:42104). 실제 방송은 연결 프로젝트의 대표 이미지·이름과 첫 리워드
   가격이다(#555). projectId가 있으면 본문 전체가 프로젝트 상세 링크다. 카드 틀과 더보기는 각 화면이 그린다. */
export function LiveProductSummary({
  product,
  projectId,
}: {
  product: LiveProduct;
  projectId?: string;
}) {
  return (
    <div className="relative flex min-w-0 flex-1 gap-2 p-2">
      <div className="bg-layer-bg relative size-[74px] shrink-0">
        {product.productImage && (
          <Image
            src={product.productImage}
            alt=""
            fill
            sizes="74px"
            className="object-cover"
            unoptimized={/^https?:\/\//.test(product.productImage)}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2>
          {projectId ? (
            <Link
              href={`/projects/${encodeURIComponent(projectId)}?tab=story`}
              className="after:absolute after:inset-0"
              aria-label={`${product.title} 프로젝트 상세 보기`}
            >
              {product.title}
            </Link>
          ) : (
            product.title
          )}
        </h2>
        {product.price !== undefined && (
          <div className="mt-1">
            {product.originalPrice !== undefined && (
              <p className="text-text-secondary text-[12px] leading-[1.3] line-through">
                {formatWon(product.originalPrice)}
              </p>
            )}
            <p className="text-[14px] leading-[1.3] font-semibold">{formatWon(product.price)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
