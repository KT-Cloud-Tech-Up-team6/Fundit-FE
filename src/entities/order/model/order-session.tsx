"use client";

import { createContext, useContext, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

export type ShippingAddress = {
  recipientName: string;
  phone: string;
  zipCode: string;
  baseAddress: string;
  detailAddress: string;
  deliveryMemo?: string;
  isDefault?: boolean;
};

export type OrderSelection = {
  projectId: string;
  cart: Record<string, { value: string | null; quantity: number }[]>;
};

export type CheckoutForm = {
  address: ShippingAddress | null;
  /** undefined는 미선택, null은 명시적으로 사용하지 않음. */
  couponId?: string | null;
  points: string;
  method: "credit_card" | "toss_pay" | null;
  card: string;
  installment: string;
  agreedIds: string[];
};

export type OrderReceipt = {
  orderId: string;
  projectId?: string;
  itemSummary: string;
  paidAmount: number;
  shippingAddress: string;
  ordererName: string;
  ordererPhone: string;
  completeMessage: string;
  expectedShippingDate: string;
};

type OrderSession = {
  selection: OrderSelection | null;
  setSelection: Dispatch<SetStateAction<OrderSelection | null>>;
  form: CheckoutForm | null;
  setForm: Dispatch<SetStateAction<CheckoutForm | null>>;
  receipt: OrderReceipt | null;
  setReceipt: Dispatch<SetStateAction<OrderReceipt | null>>;
};

const OrderContext = createContext<OrderSession | null>(null);

export function OrderSessionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<OrderSelection | null>(null);
  const [form, setForm] = useState<CheckoutForm | null>(null);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  return (
    <OrderContext value={{ selection, setSelection, form, setForm, receipt, setReceipt }}>
      {children}
    </OrderContext>
  );
}

export function useOrderSession() {
  return useContext(OrderContext);
}
