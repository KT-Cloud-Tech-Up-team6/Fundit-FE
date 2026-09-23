"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProjectPageHeader } from "@/entities/project/ui/project-sidebar";
import { SearchField } from "@/shared/components/ui/search-field";
import { Tab, TabList } from "@/shared/components/ui/tab";
import { Pagination } from "@/shared/components/ui/pagination";
import { Toast } from "@/shared/components/ui/toast";
import {
  applyCourier,
  countByFilter,
  figmaShippingShipments,
  filterByStatus,
  markShipped,
  searchShipments,
  shippingFilters,
  updateShipment,
} from "../model/shipping-demo";
import type { Courier, Shipment, ShippingFilter } from "../model/shipping-demo";
import { ShippingBulkBar, ShippingControls } from "./shipping-controls";
import { ShippingTable } from "./shipping-table";

const breadcrumb = ["내 프로젝트", "제작 · 배송", "발송정보"];

type ShippingBoardProps = {
  /** Storybook에서 목록을 바꿔 끼우기 위한 자리. 화면에서는 목업 기본값을 쓴다. */
  initialShipments?: Shipment[];
};

/* 데모 프로젝트의 발송정보 목업. UUID 프로젝트는 ShippingBoardApi가 서버 목록을 그린다(#312). */
export function ShippingBoard({ initialShipments }: ShippingBoardProps) {
  const [shipments, setShipments] = useState<Shipment[]>(
    () => initialShipments ?? figmaShippingShipments(),
  );
  const [filter, setFilter] = useState<ShippingFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [bulkCourier, setBulkCourier] = useState<Courier | "">("");
  const [toastMessage, setToastMessage] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    },
    [],
  );

  /* 선택이 비면 일괄 택배사 값도 버린다 — 다시 선택했을 때 적용 안 된 이전 값이 남지 않도록.
     직접 해제·전체 해제·저장·발송 등 선택을 비우는 모든 경로를 여기 한곳에서 덮는다. */
  if (selected.size === 0 && bulkCourier !== "") setBulkCourier("");

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

  /** API 저장 전에도 사용자가 완료 결과를 Toast로 확인할 수 있게 한다. */
  function showFeedback(message: string) {
    setToastMessage(message);
    if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(""), 3000);
  }

  function ship(ids: ReadonlySet<string>) {
    const result = markShipped(shipments, ids);
    setShipments(result.shipments);
    setSelected((current) => {
      const next = new Set(current);
      for (const shipment of result.shipments) {
        if (shipment.status === "shipped") next.delete(shipment.id);
      }
      return next;
    });
    showFeedback(
      result.skipped > 0
        ? `${result.shipped}건을 발송 처리했어요. 택배사·운송장 번호가 비어 ${result.skipped}건은 처리하지 못했어요.`
        : `${result.shipped}건을 발송 처리했어요.`,
    );
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col min-[1200px]:min-h-[766px]">
      <ProjectPageHeader breadcrumb={breadcrumb} title="발송정보" />

      <div className="mt-4">
        <TabList aria-label="발송 상태" className="gap-0" layout="track">
          {shippingFilters.map((item) => (
            <Tab
              key={item.value}
              onClick={() => setFilter(item.value)}
              selected={item.value === filter}
              size="sm"
              className="min-[1200px]:w-[130px]"
            >
              {item.label}
              <span>{counts[item.value]}</span>
              <span className="sr-only">건</span>
            </Tab>
          ))}
        </TabList>
      </div>

      <ShippingControls
        search={
          <SearchField
            aria-label="주문 검색"
            appearance="filled"
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery("")}
            placeholder="검색하기"
            size="md"
            value={query}
          />
        }
        bulkBar={
          selected.size > 0 && (
            <ShippingBulkBar
              count={selected.size}
              courier={bulkCourier}
              onCourierChange={(courier) => {
                setBulkCourier(courier);
                setShipments((current) => applyCourier(current, selected, courier));
              }}
              onShip={() => void ship(selected)}
              onSave={() => {
                /* 데모는 현재 편집값을 로컬 상태에 반영하고 완료 피드백만 준다. */
                showFeedback(`${selected.size}건의 발송 정보를 저장했어요.`);
                setSelected(new Set());
              }}
            />
          )
        }
      />

      <div id="shipping-table" className="mt-[7px]">
        <ShippingTable
          onChange={(id, patch) => {
            setShipments((current) => updateShipment(current, id, patch));
          }}
          onShip={(id) => void ship(new Set([id]))}
          onToggle={toggle}
          onToggleAll={toggleAll}
          selected={selected}
          shipments={visible}
        />
      </div>

      {toastMessage ? (
        <Toast className="shadow-light-m fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
          {toastMessage}
        </Toast>
      ) : null}

      <Pagination buildHref={() => "#shipping-table"} currentPage={1} totalPages={1} />
    </div>
  );
}
