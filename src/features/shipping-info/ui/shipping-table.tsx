"use client";

import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import { canShip, couriers, shipmentActionLabel } from "../model/shipping-demo";
import type { Courier, Shipment } from "../model/shipping-demo";

type ShippingTableProps = {
  shipments: Shipment[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onChange: (id: string, patch: Partial<Pick<Shipment, "courier" | "trackingNo">>) => void;
  onShip: (id: string) => void;
};

/* Figma `shipping_table`(488:7605) 실측 열 폭: 40 / 100 / 56 / 164 / 120 / 164 / 180 / 60.
   table-fixed로 두면 내용 길이와 무관하게 이 비율이 유지된다. */
const columnWidths = ["w-10", "w-25", "w-14", "w-41", "w-30", "w-41", "w-45", "w-15"];

const headerClasses = "text-body-s text-text-default px-2 py-3 text-left font-normal";
const cellClasses = "text-body-s text-text-default px-2 py-0.5 align-middle";

export function ShippingTable({
  shipments,
  selected,
  onToggle,
  onToggleAll,
  onChange,
  onShip,
}: ShippingTableProps) {
  const selectable = shipments.filter((shipment) => shipment.status === "pending");
  const selectedCount = selectable.filter((shipment) => selected.has(shipment.id)).length;
  const allSelected = selectable.length > 0 && selectedCount === selectable.length;

  if (shipments.length === 0) {
    return (
      <p className="text-body-m text-text-secondary py-16 text-center">
        조건에 맞는 주문이 없습니다.
      </p>
    );
  }

  return (
    /* 열이 8개라 좁은 화면에서는 표만 가로로 넘긴다. 페이지 자체는 가로 스크롤되지 않게 한다. */
    <div className="border-w-xs border-border-default overflow-x-auto rounded-xs">
      <table className="w-full min-w-[940px] table-fixed border-collapse">
        <thead className="bg-layer-surface-disabled">
          <tr>
            <th scope="col" className={`${headerClasses} ${columnWidths[0]}`}>
              <Checkbox
                aria-label="발송 대기 주문 전체 선택"
                checked={allSelected}
                disabled={selectable.length === 0}
                indeterminate={selectedCount > 0 && !allSelected}
                onChange={onToggleAll}
              />
            </th>
            <th scope="col" className={`${headerClasses} ${columnWidths[1]}`}>
              주문 번호
            </th>
            <th scope="col" className={`${headerClasses} ${columnWidths[2]}`}>
              서포터
            </th>
            <th scope="col" className={`${headerClasses} ${columnWidths[3]}`}>
              주문 옵션 · 수량
            </th>
            <th scope="col" className={`${headerClasses} ${columnWidths[4]}`}>
              배송지
            </th>
            <th scope="col" className={`${headerClasses} ${columnWidths[5]}`}>
              택배사
            </th>
            <th scope="col" className={`${headerClasses} ${columnWidths[6]}`}>
              운송장 번호
            </th>
            <th scope="col" className={`${headerClasses} ${columnWidths[7]}`}>
              상태
            </th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => {
            const shipped = shipment.status === "shipped";

            return (
              <tr
                key={shipment.id}
                className={`border-border-default border-t ${
                  selected.has(shipment.id) ? "bg-layer-surface-disabled" : ""
                }`}
              >
                <td className={cellClasses}>
                  <Checkbox
                    aria-label={`주문 ${shipment.orderNo} 선택`}
                    checked={selected.has(shipment.id)}
                    disabled={shipped}
                    onChange={() => onToggle(shipment.id)}
                  />
                </td>
                <td className={`${cellClasses} whitespace-nowrap`}>{shipment.orderNo}</td>
                <td className={`${cellClasses} truncate`}>{shipment.supporter}</td>
                <td className={cellClasses}>
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 truncate">{shipment.option}</span>
                    <span className="text-text-secondary shrink-0">X {shipment.quantity}</span>
                  </span>
                </td>
                <td className={`${cellClasses} truncate`}>{shipment.address}</td>
                <td className={cellClasses}>
                  <Select
                    aria-label={`주문 ${shipment.orderNo} 택배사`}
                    disabled={shipped}
                    onChange={(event) =>
                      onChange(shipment.id, { courier: event.target.value as Courier | "" })
                    }
                    size="sm"
                    value={shipment.courier}
                  >
                    <option value="">배송사를 선택하세요</option>
                    {couriers.map((courier) => (
                      <option key={courier} value={courier}>
                        {courier}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className={cellClasses}>
                  {/* ponytail: 운송장 번호 형식 규칙이 미정이라 자유 입력으로 둔다(Issue #43 협의 사항).
                      택배사별 자릿수가 정해지면 여기서 검증하고 Input의 error를 켠다. */}
                  <Input
                    aria-label={`주문 ${shipment.orderNo} 운송장 번호`}
                    disabled={shipped}
                    inputMode="numeric"
                    onChange={(event) => onChange(shipment.id, { trackingNo: event.target.value })}
                    placeholder="운송장 번호를 입력해주세요"
                    size="sm"
                    value={shipment.trackingNo}
                  />
                </td>
                <td className={cellClasses}>
                  <button
                    className="bg-layer-surface-disabled text-label-m text-text-default enabled:hover:bg-layer-surface-disabled-hover focus-visible:outline-border-primary disabled:text-text-disabled flex h-7 w-full items-center justify-center rounded-xs whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
                    disabled={!canShip(shipment)}
                    onClick={() => onShip(shipment.id)}
                    type="button"
                  >
                    {shipmentActionLabel[shipment.status]}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
