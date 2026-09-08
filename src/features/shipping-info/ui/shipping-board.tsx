"use client";

import { useMemo, useState } from "react";
import { SearchField } from "@/shared/components/ui/search-field";
import { Select } from "@/shared/components/ui/select";
import { Tab, TabList } from "@/shared/components/ui/tab";
import {
  applyCourier,
  countByFilter,
  couriers,
  demoShipments,
  filterByStatus,
  markShipped,
  searchShipments,
  shippingFilters,
  updateShipment,
} from "../model/shipping-demo";
import type { Courier, Shipment, ShippingFilter } from "../model/shipping-demo";
import { ShippingTable } from "./shipping-table";

const breadcrumb = ["내 프로젝트", "제작 · 배송", "발송정보"];

/* Figma `btn_action`/`save_btn`(488:7601·488:7603): 둘 다 60×36에 같은 라벨 크기다.
   면 색만 달라 공통 부분을 여기 둔다. Button은 h-46/px 사양이 달라 쓰지 않는다. */
const bulkActionClasses = [
  "text-label-m flex h-9 w-15 shrink-0 items-center justify-center rounded-xs whitespace-nowrap",
  "focus-visible:outline-border-primary focus-visible:outline-2 focus-visible:outline-offset-2",
].join(" ");

type ShippingBoardProps = {
  /** Storybook에서 목록을 바꿔 끼우기 위한 자리. 화면에서는 목업 기본값을 쓴다. */
  initialShipments?: Shipment[];
};

/* ponytail: 저장 API가 없어 목록·수정 모두 useState 목업이다. 새로고침하면 사라진다.
   페이지네이션은 두지 않는다 — 목업이 8건이고, 실제 목록 API가 정해지면 커서·페이지 방식이
   그때 결정된다. Pagination 컴포넌트는 이미 있으니 그때 붙인다. */
export function ShippingBoard({ initialShipments }: ShippingBoardProps) {
  const [shipments, setShipments] = useState<Shipment[]>(() => initialShipments ?? demoShipments());
  const [filter, setFilter] = useState<ShippingFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [bulkCourier, setBulkCourier] = useState<Courier | "">("");
  const [notice, setNotice] = useState("");

  const searched = useMemo(() => searchShipments(shipments, query), [shipments, query]);
  const counts = countByFilter(searched);
  const visible = filterByStatus(searched, filter);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const selectable = visible.filter((shipment) => shipment.status === "pending");
    const allSelected =
      selectable.length > 0 && selectable.every((shipment) => selected.has(shipment.id));

    setSelected(allSelected ? new Set() : new Set(selectable.map((shipment) => shipment.id)));
  }

  function ship(ids: ReadonlySet<string>) {
    const result = markShipped(shipments, ids);
    setShipments(result.shipments);

    const next = new Set(selected);
    for (const shipment of result.shipments) {
      if (shipment.status === "shipped") next.delete(shipment.id);
    }
    setSelected(next);
    /* 선택이 모두 비면 일괄 택배사 값도 지운다 — 다시 선택했을 때 이전 값이 남지 않도록. */
    if (next.size === 0) setBulkCourier("");
    setNotice(
      result.skipped > 0
        ? `${result.shipped}건을 발송 처리했어요. 택배사·운송장 번호가 비어 ${result.skipped}건은 처리하지 못했어요.`
        : `${result.shipped}건을 발송 처리했어요.`,
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <nav aria-label="이동 경로" className="text-label-m text-text-secondary">
        <ol className="flex items-center gap-2">
          {breadcrumb.map((crumb, index) => (
            <li key={crumb} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden>{">"}</span>}
              <span
                aria-current={index === breadcrumb.length - 1 ? "page" : undefined}
                className={index === breadcrumb.length - 1 ? "text-text-default" : undefined}
              >
                {crumb}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <h1 className="text-heading-l mt-3">발송정보</h1>

      <div className="mt-5">
        <TabList aria-label="발송 상태" layout="track">
          {shippingFilters.map((item) => (
            <Tab
              key={item.value}
              onClick={() => setFilter(item.value)}
              selected={item.value === filter}
              size="sm"
            >
              {item.label}
              <span>{counts[item.value]}</span>
              <span className="sr-only">건</span>
            </Tab>
          ))}
        </TabList>
      </div>

      {/* Figma `table_control_bar`(488:7589) 실측: 컨트롤은 모두 36px 한 줄, 간격 12px,
          검색 282 · 택배사 164 · 발송 처리 60 · 저장 60. */}
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p aria-live="polite" className="text-body-s text-text-default">
          {selected.size > 0 ? `${selected.size} 개 선택 됨` : ""}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-[282px] sm:shrink-0">
            <SearchField
              aria-label="주문 검색"
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery("")}
              placeholder="검색하기"
              size="sm"
              value={query}
            />
          </div>

          {/* 일괄 조작은 선택이 있을 때만 의미가 있어 그때만 보여준다(Figma 488:7546). */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3">
              <Select
                aria-label="선택한 주문의 택배사"
                /* Select에 w-full이 박혀 있어 important 없이는 폭이 안 먹는다. */
                className="w-41! shrink-0"
                onChange={(event) => {
                  const courier = event.target.value as Courier | "";
                  setBulkCourier(courier);
                  setShipments((current) => applyCourier(current, selected, courier));
                }}
                size="sm"
                value={bulkCourier}
              >
                <option value="">배송사를 선택하세요</option>
                {couriers.map((courier) => (
                  <option key={courier} value={courier}>
                    {courier}
                  </option>
                ))}
              </Select>
              <button
                className={`${bulkActionClasses} bg-layer-surface-disabled text-text-default hover:bg-layer-surface-disabled-hover`}
                onClick={() => ship(selected)}
                type="button"
              >
                발송 처리
              </button>
              <button
                className={`${bulkActionClasses} bg-layer-surface-primary text-text-inverse hover:bg-layer-surface-primary-hover`}
                onClick={() => {
                  /* ponytail: 저장 API가 없어 안내만 띄운다. 계약이 생기면 여기서 보낸다. */
                  setNotice(`${selected.size}건의 발송 정보를 저장했어요.`);
                  setSelected(new Set());
                  setBulkCourier("");
                }}
                type="button"
              >
                저장
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <ShippingTable
          onChange={(id, patch) => setShipments((current) => updateShipment(current, id, patch))}
          onShip={(id) => ship(new Set([id]))}
          onToggle={toggle}
          onToggleAll={toggleAll}
          selected={selected}
          shipments={visible}
        />
      </div>

      <p aria-live="polite" className="sr-only">
        {notice}
      </p>
    </div>
  );
}
