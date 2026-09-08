import assert from "node:assert/strict";
import test from "node:test";
import {
  applyCourier,
  canShip,
  countByFilter,
  demoShipments,
  filterByStatus,
  markShipped,
  searchShipments,
  updateShipment,
} from "./shipping-demo.ts";

test("검색은 주문번호·서포터·배송지에서 찾고 공백이면 전체를 준다", () => {
  const shipments = demoShipments();
  assert.equal(searchShipments(shipments, "   "), shipments);
  assert.equal(searchShipments(shipments, "없는값").length, 0);

  const bySupporter = searchShipments(shipments, "홍길동");
  assert.ok(bySupporter.length > 0);
  assert.ok(bySupporter.every((shipment) => shipment.supporter === "홍길동"));

  const byAddress = searchShipments(shipments, "해운대");
  assert.ok(byAddress.length > 0);
  assert.ok(byAddress.every((shipment) => shipment.address.includes("해운대")));
});

test("상태 필터와 탭 건수는 같은 목록에서 나온다", () => {
  const shipments = demoShipments();
  const counts = countByFilter(shipments);

  assert.equal(counts.all, shipments.length);
  assert.equal(counts.pending + counts.shipped, counts.all);
  assert.equal(filterByStatus(shipments, "pending").length, counts.pending);
  assert.equal(filterByStatus(shipments, "shipped").length, counts.shipped);
  assert.equal(filterByStatus(shipments, "all"), shipments);
});

test("발송 처리는 택배사와 운송장이 모두 있어야 가능하다", () => {
  const [pending] = demoShipments();
  assert.equal(canShip(pending), false);

  const withCourier = { ...pending, courier: "한진택배" };
  assert.equal(canShip(withCourier), false);
  assert.equal(canShip({ ...withCourier, trackingNo: "   " }), false);
  assert.equal(canShip({ ...withCourier, trackingNo: "123" }), true);
  // 이미 발송된 건은 다시 처리하지 않는다.
  assert.equal(canShip({ ...withCourier, trackingNo: "123", status: "shipped" }), false);
});

test("일괄 택배사 적용은 발송 전 행만 바꾸고 빈 값은 무시한다", () => {
  const shipments = demoShipments();
  const ids = new Set([shipments[0].id, shipments[1].id]); // s-2는 발송 완료

  assert.equal(applyCourier(shipments, ids, ""), shipments);

  const next = applyCourier(shipments, ids, "롯데택배");
  assert.equal(next[0].courier, "롯데택배");
  assert.equal(next[1].courier, "CJ대한통운");
});

test("일괄 발송 처리는 조건을 채운 행만 옮기고 나머지 수를 돌려준다", () => {
  let shipments = demoShipments();
  const ready = shipments[0].id;
  const notReady = shipments[2].id;

  shipments = updateShipment(shipments, ready, { courier: "한진택배", trackingNo: "123" });

  const result = markShipped(shipments, new Set([ready, notReady]));
  assert.equal(result.shipped, 1);
  assert.equal(result.skipped, 1);
  assert.equal(result.shipments.find((s) => s.id === ready).status, "shipped");
  assert.equal(result.shipments.find((s) => s.id === notReady).status, "pending");

  // 옮길 게 없으면 배열 정체성을 유지해 불필요한 리렌더를 만들지 않는다.
  const none = markShipped(shipments, new Set([notReady]));
  assert.equal(none.shipments, shipments);
  assert.equal(none.shipped, 0);
});
