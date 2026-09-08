/* 발송정보(FL_S_DL_SHIP)의 화면 상태와 순수 헬퍼.
   ponytail: 주문·배송 API가 없어(docs/OPEN_DECISIONS.md P1) 목록과 저장 모두 useState 목업이다.
   계약이 생기면 이 파일의 타입을 응답 스키마에 맞추고 헬퍼는 그대로 재사용한다. */

/* Figma "상태 명세"(488:8247) 드롭다운에 그려진 6개만 쓴다. 지어내지 않는다. */
export const couriers = [
  "우체국 택배",
  "CJ대한통운",
  "한진택배",
  "롯데택배",
  "로젠택배",
  "경동택배",
] as const;

export type Courier = (typeof couriers)[number];

/** Figma 상태 명세: 배송 전 → `발송 처리`(활성), 배송 후 → `발송 완료`(비활성). */
export type ShipmentStatus = "pending" | "shipped";

export const shipmentActionLabel: Record<ShipmentStatus, string> = {
  pending: "발송 처리",
  shipped: "발송 완료",
};

export type Shipment = {
  id: string;
  orderNo: string;
  supporter: string;
  option: string;
  quantity: number;
  address: string;
  /** 미선택은 빈 문자열. <select>의 빈 option과 값을 맞춘다. */
  courier: Courier | "";
  trackingNo: string;
  status: ShipmentStatus;
};

export const shippingFilters = [
  { value: "all", label: "전체" },
  { value: "pending", label: "발송 대기" },
  { value: "shipped", label: "발송 완료" },
] as const;

export type ShippingFilter = (typeof shippingFilters)[number]["value"];

/** 주문번호·서포터·배송지에서 찾는다. 공백만 넣으면 전체를 돌려준다. */
export function searchShipments(shipments: Shipment[], query: string): Shipment[] {
  const keyword = query.trim().toLowerCase();
  if (keyword === "") return shipments;

  return shipments.filter((shipment) =>
    [shipment.orderNo, shipment.supporter, shipment.address].some((field) =>
      field.toLowerCase().includes(keyword),
    ),
  );
}

export function filterByStatus(shipments: Shipment[], filter: ShippingFilter): Shipment[] {
  return filter === "all" ? shipments : shipments.filter((s) => s.status === filter);
}

/** 탭에 붙는 건수. 검색 결과 안에서 센다 — 탭 합이 화면과 어긋나지 않게. */
export function countByFilter(shipments: Shipment[]): Record<ShippingFilter, number> {
  return {
    all: shipments.length,
    pending: shipments.filter((s) => s.status === "pending").length,
    shipped: shipments.filter((s) => s.status === "shipped").length,
  };
}

/** 발송 처리 가능 조건 — 아직 발송 전이고 택배사·운송장이 모두 채워져 있어야 한다. */
export function canShip(shipment: Shipment): boolean {
  return (
    shipment.status === "pending" && shipment.courier !== "" && shipment.trackingNo.trim() !== ""
  );
}

export function updateShipment(
  shipments: Shipment[],
  id: string,
  patch: Partial<Pick<Shipment, "courier" | "trackingNo">>,
): Shipment[] {
  return shipments.map((shipment) => (shipment.id === id ? { ...shipment, ...patch } : shipment));
}

/** 선택한 행에 택배사를 한 번에 넣는다. 이미 발송된 행은 건드리지 않는다. */
export function applyCourier(
  shipments: Shipment[],
  ids: ReadonlySet<string>,
  courier: Courier | "",
): Shipment[] {
  if (courier === "") return shipments;

  return shipments.map((shipment) =>
    ids.has(shipment.id) && shipment.status === "pending" ? { ...shipment, courier } : shipment,
  );
}

/**
 * 선택한 행 중 발송 처리 가능한 것만 발송 완료로 옮긴다.
 * 조건을 못 채운 행은 `skipped`로 돌려줘 호출부가 왜 안 넘어갔는지 알릴 수 있게 한다.
 */
export function markShipped(
  shipments: Shipment[],
  ids: ReadonlySet<string>,
): { shipments: Shipment[]; shipped: number; skipped: number } {
  let shipped = 0;
  let skipped = 0;

  const next = shipments.map((shipment) => {
    if (!ids.has(shipment.id) || shipment.status === "shipped") return shipment;
    if (!canShip(shipment)) {
      skipped += 1;
      return shipment;
    }
    shipped += 1;
    return { ...shipment, status: "shipped" as const };
  });

  return { shipments: shipped > 0 ? next : shipments, shipped, skipped };
}

const addresses = ["서울특별시 땡땡구", "경기도 성남시 분당구", "부산광역시 해운대구"];
const supporters = ["홍길동", "김수한무", "닉네임임임", "세글자", "네글자하", "다섯글자다"];

/** 목업 목록. 발송 완료가 섞여 있어야 탭·상태 분기를 다 볼 수 있다. */
export function demoShipments(): Shipment[] {
  return Array.from({ length: 8 }, (_, index) => {
    const shipped = index === 1 || index === 4;

    return {
      id: `s-${index + 1}`,
      orderNo: `2026 - ${String(100_000 + index * 137).padStart(6, "0")}`,
      supporter: supporters[index % supporters.length],
      option: `리워드 이름이 얼마나 길어질지 모르는 옵션 ${index + 1}`,
      quantity: (index % 3) + 1,
      address: addresses[index % addresses.length],
      courier: shipped ? "CJ대한통운" : "",
      trackingNo: shipped ? `1234567890${index}` : "",
      status: shipped ? "shipped" : "pending",
    };
  });
}
