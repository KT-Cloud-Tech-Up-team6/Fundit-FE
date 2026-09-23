"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerOrders } from "@/entities/order/api/seller-order-api";
import { ProjectPageHeader } from "@/entities/project/ui/project-sidebar";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { SearchField } from "@/shared/components/ui/search-field";
import { Select } from "@/shared/components/ui/select";
import { Tab, TabList } from "@/shared/components/ui/tab";
import { Pagination } from "@/shared/components/ui/pagination";
import { Toast } from "@/shared/components/ui/toast";
import {
  applyCourier,
  countByFilter,
  couriers,
  figmaShippingShipments,
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
  "text-caption-s flex h-9 shrink-0 items-center justify-center rounded-xs font-medium whitespace-nowrap",
  "focus-visible:outline-border-primary focus-visible:outline-2 focus-visible:outline-offset-2",
].join(" ");

type ShippingBoardProps = {
  /** Storybook에서 목록을 바꿔 끼우기 위한 자리. 화면에서는 목업 기본값을 쓴다. */
  initialShipments?: Shipment[];
  projectId?: string;
};

/* UUID 프로젝트는 판매자 주문을 조회한다. 배송 상태 조회 계약 전까지 등록은 잠근다. */
export function ShippingBoard({ initialShipments, projectId }: ShippingBoardProps) {
  const orders = useQuery({
    queryKey: ["seller-shipping-orders", projectId],
    queryFn: ({ signal }) => getSellerOrders(projectId!, signal),
    enabled: Boolean(projectId),
  });
  const apiShipments = useMemo<Shipment[]>(() => {
    if (!orders.data) return [];
    return orders.data.map((order) => {
      const lines = order.lineItems.map((line) => {
        const option = line.options
          .map((item) => `${item.optionGroupName}: ${item.optionValue}`)
          .join(", ");
        return `${line.rewardName}${option ? ` (${option})` : ""}`;
      });
      return {
        id: order.orderId,
        orderNo: order.orderId,
        supporter: order.shippingAddress.recipientName,
        option: lines.join(" / "),
        quantity: order.lineItems.reduce((total, line) => total + line.quantity, 0),
        address: [order.shippingAddress.addressLine1, order.shippingAddress.addressLine2]
          .filter(Boolean)
          .join(" "),
        courier: "",
        trackingNo: "",
        // ShipmentControllerV2 GET verifies buyer ownership; no seller status contract exists yet.
        status: "unknown",
      };
    });
  }, [orders.data]);
  const [shipments, setShipments] = useState<Shipment[]>(
    () => initialShipments ?? figmaShippingShipments(),
  );
  const [filter, setFilter] = useState<ShippingFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [bulkCourier, setBulkCourier] = useState<Courier | "">("");
  const [toastMessage, setToastMessage] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleShipments = projectId ? apiShipments : shipments;
  const readOnly = Boolean(projectId);

  useEffect(
    () => () => {
      if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    },
    [],
  );

  /* 선택이 비면 일괄 택배사 값도 버린다 — 다시 선택했을 때 적용 안 된 이전 값이 남지 않도록.
     직접 해제·전체 해제·저장·발송 등 선택을 비우는 모든 경로를 여기 한곳에서 덮는다. */
  if (selected.size === 0 && bulkCourier !== "") setBulkCourier("");

  const searched = useMemo(
    () => searchShipments(visibleShipments, query),
    [visibleShipments, query],
  );
  const counts = countByFilter(searched);
  const visible = filterByStatus(searched, readOnly ? "all" : filter);

  function toggle(id: string) {
    if (readOnly) return;
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (readOnly) return;
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
    if (readOnly) return;
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

  if (projectId && orders.isPending) return <p role="status">발송 대상을 불러오고 있습니다.</p>;
  if (projectId && orders.isError)
    return (
      <QueryErrorState
        variant="section"
        error={orders.error}
        description="발송 대상을 불러오지 못했습니다."
        onRetry={() => void orders.refetch()}
        notFoundHref="/seller/projects"
      />
    );

  return (
    <div className="relative flex min-w-0 flex-1 flex-col lg:min-h-[766px]">
      <ProjectPageHeader breadcrumb={breadcrumb} title="발송정보" />
      {readOnly && (
        <p className="text-body-s mt-3" role="status">
          배송 상태를 확인할 수 없어 전체 주문만 표시합니다. 상태별 조회와 발송 정보 편집은 아직
          이용할 수 없습니다.
        </p>
      )}

      <div className="mt-4">
        <TabList aria-label="발송 상태" className="gap-0" layout="track">
          {shippingFilters.map((item) => (
            <Tab
              key={item.value}
              disabled={readOnly && item.value !== "all"}
              onClick={() => setFilter(item.value)}
              selected={item.value === (readOnly ? "all" : filter)}
              size="sm"
              className="md:w-[130px]"
            >
              {item.label}
              <span>{readOnly && item.value !== "all" ? "—" : counts[item.value]}</span>
              <span className="sr-only">
                {readOnly && item.value !== "all" ? "조회 불가" : "건"}
              </span>
            </Tab>
          ))}
        </TabList>
      </div>

      {/* Figma 선택 상태: 검색은 탭의 오른쪽으로 올라가고, 표 바로 위 자리는
          선택 수와 36px 일괄 작업 바가 차지한다. */}
      {selected.size > 0 && (
        <div className="mt-4 w-full md:absolute md:top-[88px] md:right-0 md:mt-0 md:w-[282px]">
          <SearchField
            aria-label="주문 검색"
            appearance="filled"
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery("")}
            placeholder="검색하기"
            size="md"
            value={query}
          />
        </div>
      )}

      <div className={selected.size > 0 ? "mt-4 md:mt-8" : "mt-8"}>
        {selected.size === 0 ? (
          <div className="flex justify-end">
            <div className="w-full sm:w-[282px]">
              <SearchField
                aria-label="주문 검색"
                appearance="filled"
                onChange={(event) => setQuery(event.target.value)}
                onClear={() => setQuery("")}
                placeholder="검색하기"
                size="md"
                value={query}
              />
            </div>
          </div>
        ) : !readOnly ? (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p aria-live="polite" className="text-body-s text-text-default">
              {selected.size} 개 선택 됨
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-[9px]">
              <Select
                aria-label="선택한 주문의 택배사"
                /* Select의 기본 w-full보다 Figma의 164px 일괄 택배사 폭을 우선한다. */
                className="w-full shrink-0 sm:w-41!"
                onChange={(event) => {
                  const courier = event.target.value as Courier | "";
                  setBulkCourier(courier);
                  setShipments((current) => applyCourier(current, selected, courier));
                }}
                size="sm"
                value={bulkCourier}
              >
                <option value="">배송사를 입력하세요</option>
                {couriers.map((courier) => (
                  <option key={courier} value={courier}>
                    {courier}
                  </option>
                ))}
              </Select>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <button
                  className={`${bulkActionClasses} bg-layer-surface-disabled text-text-default hover:bg-layer-surface-disabled-hover min-w-0 flex-1 sm:w-[114px] sm:flex-none`}
                  onClick={() => void ship(selected)}
                  type="button"
                >
                  발송 처리
                </button>
                <button
                  className={`${bulkActionClasses} bg-layer-surface-primary text-text-inverse hover:bg-layer-surface-primary-hover min-w-0 flex-1 sm:w-[146px] sm:flex-none`}
                  onClick={() => {
                    /* API 계약 전에는 현재 편집값을 로컬 상태에 반영하고 완료 피드백을 준다.
                       계약이 생기면 이 지점에서 선택 건만 저장하는 mutation을 호출한다. */
                    showFeedback(`${selected.size}건의 발송 정보를 저장했어요.`);
                    setSelected(new Set());
                  }}
                  type="button"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div id="shipping-table" className="mt-[7px]">
        <ShippingTable
          readOnly={readOnly}
          onChange={(id, patch) => {
            if (!readOnly) setShipments((current) => updateShipment(current, id, patch));
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
