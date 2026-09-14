import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { Icon } from "@/shared/components/ui/icon";
import { refundHistory } from "../model/refunds-demo";

export function BuyerRefunds({ entries = refundHistory }: { entries?: typeof refundHistory }) {
  return (
    <BuyerAccountScreen title="취소/환불/교환 내역">
      <div className="bg-layer-bg min-h-[calc(100dvh-52px)] pb-[env(safe-area-inset-bottom)]">
        {entries.length === 0 ? (
          <p className="bg-layer-surface-default text-body-s px-5 py-24 text-center">
            취소/환불/교환 내역이 없습니다.
          </p>
        ) : (
          entries.map((entry) => (
            <details
              key={entry.id}
              open={entry.id === "cancel-complete"}
              className="group border-border-default bg-layer-surface-default border-b px-5 py-3"
            >
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="text-body-s mb-1 flex items-center justify-between">
                  <span>{entry.type}</span>
                  <Icon
                    name="arrowDown"
                    className="text-text-disabled size-[14px] group-open:rotate-180"
                  />
                </div>
                <p className="text-body-s leading-5">{entry.fundingNumber}</p>
                <h2 className="text-body-m max-w-[259px] truncate leading-6 font-medium">
                  {entry.title}
                </h2>
                <p className="text-body-s mt-2 leading-5">
                  진행상태: <strong className="font-semibold">{entry.status}</strong>
                  {entry.completedAt && ` ${entry.completedAt}`}
                </p>
              </summary>
              <div className="pt-5">
                <dl className="bg-layer-surface-disabled text-body-s space-y-4 rounded-xs p-4 leading-[18px]">
                  {[
                    ["신청 일자", entry.requestedAt],
                    ["접수 사유", entry.reason],
                    ["접수 상품", entry.product],
                    ["옵션", entry.option],
                    ["판매가", `${entry.price.toLocaleString("ko-KR")}원`],
                    ["신청 수량", `${entry.quantity}개`],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[91px_1fr] gap-3">
                      <dt>{label}</dt>
                      <dd className="min-w-0 break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
                {entry.cash !== null && (
                  <dl className="text-body-s mt-3 space-y-2">
                    <div className="flex justify-between gap-3">
                      <dt>실 환불 금액</dt>
                      <dd>{entry.cash.toLocaleString("ko-KR")}원</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>적립금 환불 금액</dt>
                      <dd>{entry.points?.toLocaleString("ko-KR")}원</dd>
                    </div>
                  </dl>
                )}
              </div>
            </details>
          ))
        )}
      </div>
    </BuyerAccountScreen>
  );
}
