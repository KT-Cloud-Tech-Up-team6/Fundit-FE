"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { registerShipment } from "@/entities/fulfillment/api/fulfillment-api";
import {
  getSellerOrderShippingCounts,
  getSellerOrders,
} from "@/entities/order/api/seller-order-api";
import { ProjectPageHeader } from "@/entities/project/ui/project-sidebar";
import { ApiError } from "@/shared/api/api-error";
import { Pagination } from "@/shared/components/ui/pagination";
import { SearchField } from "@/shared/components/ui/search-field";
import { Tab, TabList } from "@/shared/components/ui/tab";
import { Toast } from "@/shared/components/ui/toast";
import {
  sellerShippingFilter,
  shipResultMessage,
  shippingCounts,
  toShipment,
  type ShippingView,
} from "../model/seller-shipment";
import {
  canShip,
  shippingFilters,
  type Courier,
  type Shipment,
  type ShippingFilter,
} from "../model/shipping-demo";
import { ShippingBulkBar, ShippingControls } from "./shipping-controls";
import { ShippingTable } from "./shipping-table";

const breadcrumb = ["내 프로젝트", "제작 · 배송", "발송정보"];
const noSelection: ReadonlySet<string> = new Set();

type Draft = Partial<Pick<Shipment, "courier" | "trackingNo">>;

/* UUID 프로젝트의 발송정보(#312). 탭·검색어·페이지를 URL에 두고 서버가 거른 목록을 그린다.
   발송 처리는 송장 등록 API로 저장하며, 등록하면 서버에서 곧바로 발송 완료가 된다.
   택배사·운송장만 따로 저장하는 API가 없어 저장 버튼은 준비중이다. */
export function ShippingBoardApi({
  memberId,
  projectId,
  status,
  search,
  page,
}: { memberId: string; projectId: string } & ShippingView) {
  const client = useQueryClient();
  const ordersKey = ["seller-shipping-orders", memberId, projectId];
  const countsKey = ["seller-shipping-counts", memberId, projectId];
  const orders = useQuery({
    queryKey: [...ordersKey, status, search, page],
    queryFn: ({ signal }) =>
      getSellerOrders(
        projectId,
        { q: search, shippingFilter: sellerShippingFilter[status], page: page - 1 },
        signal,
      ),
  });
  const counts = useQuery({
    queryKey: countsKey,
    queryFn: ({ signal }) => getSellerOrderShippingCounts(projectId, signal),
  });

  /* 입력 중인 택배사·운송장은 탭·페이지를 옮겨도 남긴다. 발송일은 발송 이벤트로 비동기 갱신되므로
     이 화면에서 발송 처리한 주문은 목록에 반영되기 전에도 발송 완료로 보여 준다. */
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [shippedIds, setShippedIds] = useState<ReadonlySet<string>>(noSelection);
  /* 선택은 지금 보고 있는 탭·검색어·페이지에만 둔다. 주소가 바뀌면 비운다. */
  const view = `${status}|${search}|${page}`;
  const [selection, setSelection] = useState({ view, ids: noSelection });
  const selected = selection.view === view ? selection.ids : noSelection;
  const [bulkCourier, setBulkCourier] = useState<Courier | "">("");
  const [busy, setBusy] = useState(false);
  const shipping = useRef(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    },
    [],
  );

  /* 선택이 비면 일괄 택배사 값도 버린다. 다시 선택했을 때 이전 값이 남지 않게 한다. */
  if (selected.size === 0 && bulkCourier !== "") setBulkCourier("");

  const shipments: Shipment[] = (orders.data?.content ?? []).map((order) => {
    const row = { ...toShipment(order, status), ...drafts[order.orderId] };
    return shippedIds.has(row.id) ? { ...row, status: "shipped" as const } : row;
  });
  const tabCounts = counts.data && shippingCounts(counts.data);
  const path = `/seller/projects/${projectId}/shipping`;
  const buildHref = (nextStatus: ShippingFilter, nextPage = 1) => {
    const query = new URLSearchParams();
    if (nextStatus !== "all") query.set("status", nextStatus);
    if (search) query.set("search", search);
    if (nextPage > 1) query.set("page", String(nextPage));
    const queryString = query.toString();
    return queryString ? `${path}?${queryString}` : path;
  };

  function setSelected(update: (current: ReadonlySet<string>) => ReadonlySet<string>) {
    setSelection((previous) => ({
      view,
      ids: update(previous.view === view ? previous.ids : noSelection),
    }));
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const selectable = shipments.filter((shipment) => shipment.status === "pending");
    const allSelected =
      selectable.length > 0 && selectable.every((shipment) => selected.has(shipment.id));
    setSelected(() =>
      allSelected ? noSelection : new Set(selectable.map((shipment) => shipment.id)),
    );
  }

  function updateDraft(id: string, patch: Draft) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  function applyBulkCourier(courier: Courier | "") {
    setBulkCourier(courier);
    if (courier === "") return;
    for (const shipment of shipments)
      if (selected.has(shipment.id) && shipment.status === "pending")
        updateDraft(shipment.id, { courier });
  }

  function showFeedback(message: string) {
    setToastMessage(message);
    if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(""), 3000);
  }

  async function ship(ids: ReadonlySet<string>) {
    if (shipping.current) return;
    const targets = shipments.filter(
      (shipment) => ids.has(shipment.id) && shipment.status === "pending",
    );
    const ready = targets.filter(canShip);
    const result = { shipped: 0, already: 0, skipped: targets.length - ready.length, failed: 0 };
    if (ready.length > 0) {
      shipping.current = true;
      setBusy(true);
      const outcomes = await Promise.allSettled(
        ready.map((shipment) =>
          registerShipment(projectId, shipment.id, {
            carrier: shipment.courier,
            trackingNumber: shipment.trackingNo.trim(),
          }),
        ),
      );
      const done = new Set<string>();
      const already = new Set<string>();
      outcomes.forEach((outcome, index) => {
        const id = ready[index].id;
        if (outcome.status === "fulfilled") done.add(id);
        else if (outcome.reason instanceof ApiError && outcome.reason.code === "ALREADY_SHIPPED")
          already.add(id);
      });
      result.shipped = done.size;
      result.already = already.size;
      result.failed = ready.length - done.size - already.size;
      /* 이미 발송된 주문은 서버에 등록된 송장을 판매자가 조회할 수 없으므로 입력값을 지워 오해를 막는다. */
      setDrafts((current) => {
        const next = { ...current };
        for (const id of already) delete next[id];
        return next;
      });
      setShippedIds((current) => new Set([...current, ...done, ...already]));
      setSelected(
        (current) => new Set([...current].filter((id) => !done.has(id) && !already.has(id))),
      );
      shipping.current = false;
      setBusy(false);
      void client.invalidateQueries({ queryKey: ordersKey });
      void client.invalidateQueries({ queryKey: countsKey });
    }
    showFeedback(shipResultMessage(result));
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col min-[1200px]:min-h-[766px]">
      <ProjectPageHeader breadcrumb={breadcrumb} title="발송정보" />

      <div className="mt-4">
        <TabList aria-label="발송 상태" className="gap-0" layout="track" mode="nav">
          {shippingFilters.map((item) => (
            <Tab
              key={item.value}
              href={buildHref(item.value)}
              selected={item.value === status}
              size="sm"
              className="min-[1200px]:w-[130px]"
            >
              {item.label}
              <span>{tabCounts?.[item.value] ?? "—"}</span>
              <span className="sr-only">건</span>
            </Tab>
          ))}
        </TabList>
        {counts.isError && (
          <p role="alert" className="text-body-s mt-2">
            건수를 불러오지 못했습니다.{" "}
            <button type="button" className="underline" onClick={() => void counts.refetch()}>
              다시 시도
            </button>
          </p>
        )}
      </div>

      <ShippingControls
        search={
          /* 판매자 프로젝트 목록처럼 GET으로 제출해 검색어를 URL에 남긴다. 탭은 유지하고 1페이지로 간다. */
          <form action={path}>
            {status !== "all" && <input type="hidden" name="status" value={status} />}
            <SearchField
              key={search}
              aria-label="주문 검색"
              appearance="filled"
              defaultValue={search}
              name="search"
              placeholder="검색하기"
              size="md"
            />
          </form>
        }
        bulkBar={
          selected.size > 0 && (
            <ShippingBulkBar
              busy={busy}
              count={selected.size}
              courier={bulkCourier}
              onCourierChange={applyBulkCourier}
              onShip={() => void ship(selected)}
            />
          )
        }
      />

      <div id="shipping-table" className="mt-[7px]">
        {orders.isPending ? (
          <p role="status" className="text-body-m py-16 text-center">
            발송 대상을 불러오고 있습니다.
          </p>
        ) : orders.isError ? (
          <div role="alert" className="text-body-m py-16 text-center">
            <p>발송 대상을 불러오지 못했습니다.</p>
            <button type="button" className="mt-2 underline" onClick={() => void orders.refetch()}>
              다시 시도
            </button>
          </div>
        ) : (
          /* 등록 요청 중에는 표를 잠가 같은 주문을 두 번 보내지 않게 한다. */
          <ShippingTable
            readOnly={busy}
            shipments={shipments}
            selected={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onChange={updateDraft}
            onShip={(id) => void ship(new Set([id]))}
          />
        )}
      </div>

      {toastMessage ? (
        <Toast className="shadow-light-m fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
          {toastMessage}
        </Toast>
      ) : null}

      {orders.data && (
        <Pagination
          currentPage={page}
          totalPages={orders.data.totalPages}
          buildHref={(nextPage) => buildHref(status, nextPage)}
        />
      )}
    </div>
  );
}
