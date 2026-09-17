import type { ReactNode } from "react";
import { CategoryReturnPathGuard } from "./category-return-path-guard";
import { OrderSessionProvider } from "@/entities/order/model/order-session";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <>
      <CategoryReturnPathGuard />
      <OrderSessionProvider>{children}</OrderSessionProvider>
    </>
  );
}
