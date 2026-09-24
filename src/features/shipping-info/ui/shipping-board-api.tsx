"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSellerShipments,
  registerShipment,
  saveShipmentDraft,
} from "@/entities/fulfillment/api/fulfillment-api";
import {
  getSellerOrderShippingCounts,
  getSellerOrders,
} from "@/entities/order/api/seller-order-api";
import { ProjectPageHeader } from "@/entities/project/ui/project-sidebar";
import { ApiError } from "@/shared/api/api-error";
import { Pagination } from "@/shared/components/ui/pagination";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { SearchField } from "@/shared/components/ui/search-field";
import { Tab, TabList } from "@/shared/components/ui/tab";
import { Toast } from "@/shared/components/ui/toast";
import {
  sellerShippingFilter,
  shipmentResultMessage,
  shippingCounts,
  toShipment,
  type ShipmentAction,
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

/* UUID 프로젝트의 발송정보(#312·#316). 탭·검색어·페이지를 URL에 두고 서버가 거른 목록을 그린다.
   행의 택배사·운송장은 그 페이지 주문의 판매자 송장 조회로 채운다. 발송 처리는 송장 등록 API로
   곧바로 발송 완료가 되고, 저장은 임시저장 API로 택배사·운송장만 남겨 발송 대기를 유지한다. */
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
  const recordsKey = ["seller-shipping-records", memberId, projectId];
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
  /* 목록 한 페이지(20건)의 송장을 한 번에 받는다. 실패해도 목록은 그대로 두고 표 위에 알린다.
     발송 처리로 목록에서 주문이 빠지면 키가 바뀐다. 새 조회가 끝날 때까지 이전 결과를 두어 저장해 둔
     송장이 빈칸으로, 발송된 행이 발송 대기로 잠깐 돌아가지 않게 한다. 행은 fundingId로 찾으므로
     이전 결과가 다른 주문에 붙지 않는다. */
  const fundingIds = (orders.data?.content ?? []).map((order) => order.orderId);
  const records = useQuery({
    queryKey: [...recordsKey, fundingIds],
    queryFn: ({ signal }) => getSellerShipments(projectId, fundingIds, signal),
    enabled: fundingIds.length > 0,
    placeholderData: keepPreviousData,
  });
  const recordById = new Map(records.data?.map((record) => [record.fundingId, record] as const));

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
  const submitting = useRef(false);
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

  /* 발송 완료 행은 서버에 등록된 송장을 보여 주고, 입력값은 아직 발송 대기인 행에만 얹는다.
     이 화면에서 방금 발송 처리한 주문은 다시 조회되기 전이라 보낸 입력값으로 보여 준다. */
  const shipments: Shipment[] = (orders.data?.content ?? []).map((order) => {
    const row = toShipment(order, recordById.get(order.orderId));
    if (shippedIds.has(row.id)) return { ...row, ...drafts[row.id], status: "shipped" as const };
    return row.status === "pending" ? { ...row, ...drafts[row.id] } : row;
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

  /* 마지막 페이지의 주문을 모두 발송 처리하면 다시 조회했을 때 그 페이지가 사라진다.
     주소의 페이지가 범위를 넘으면 빈 표 대신 마지막 페이지로 옮긴다. */
  const router = useRouter();
  const lastPage = orders.data?.totalPages ?? 0;
  const lastPageHref = lastPage > 0 && page > lastPage ? buildHref(status, lastPage) : null;
  useEffect(() => {
    if (lastPageHref) router.replace(lastPageHref);
  }, [lastPageHref, router]);

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

  /* 발송 처리는 등록 API로 곧바로 발송 완료가 되고, 저장은 임시저장 API로 발송 대기를 유지한다.
     둘 다 택배사·운송장이 모두 있어야 보낸다(BE 필수값). */
  async function submit(action: ShipmentAction, ids: ReadonlySet<string>) {
    if (submitting.current) return;
    const targets = shipments.filter(
      (shipment) => ids.has(shipment.id) && shipment.status === "pending",
    );
    const ready = targets.filter(canShip);
    const result = { done: 0, already: 0, skipped: targets.length - ready.length, failed: 0 };
    if (ready.length > 0) {
      submitting.current = true;
      setBusy(true);
      const send = action === "ship" ? registerShipment : saveShipmentDraft;
      const outcomes = await Promise.allSettled(
        ready.map((shipment) =>
          send(projectId, shipment.id, {
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
      result.done = done.size;
      result.already = already.size;
      result.failed = ready.length - done.size - already.size;
      /* 이미 발송된 주문은 송장을 고칠 수 없다. 입력값을 버리고 다시 조회한 등록값을 보여 준다. */
      setDrafts((current) => {
        const next = { ...current };
        for (const id of already) delete next[id];
        return next;
      });
      setShippedIds(
        (current) => new Set([...current, ...already, ...(action === "ship" ? done : [])]),
      );
      /* 처리한 주문은 선택에서 뺀다. 빈 입력·실패 건은 입력과 선택을 남겨 다시 시도하게 한다. */
      setSelected(
        (current) => new Set([...current].filter((id) => !done.has(id) && !already.has(id))),
      );
      submitting.current = false;
      setBusy(false);
      void client.invalidateQueries({ queryKey: ordersKey });
      void client.invalidateQueries({ queryKey: countsKey });
      void client.invalidateQueries({ queryKey: recordsKey });
    }
    showFeedback(shipmentResultMessage(action, result));
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
              onShip={() => void submit("ship", selected)}
              onSave={() => void submit("save", selected)}
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
          <QueryErrorState
            variant="section"
            error={orders.error}
            description="발송 대상을 불러오지 못했습니다."
            className="py-16"
            onRetry={() => void orders.refetch()}
            notFoundHref="/seller/projects"
          />
        ) : (
          <>
            {records.isError && (
              <p role="alert" className="text-body-s mb-2">
                등록된 택배사·운송장을 불러오지 못했습니다.{" "}
                <button type="button" className="underline" onClick={() => void records.refetch()}>
                  다시 시도
                </button>
              </p>
            )}
            {/* 등록·저장 요청 중에는 표를 잠가 같은 주문을 두 번 보내지 않게 한다. */}
            <ShippingTable
              readOnly={busy}
              shipments={shipments}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
              onChange={updateDraft}
              onShip={(id) => void submit("ship", new Set([id]))}
            />
          </>
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
