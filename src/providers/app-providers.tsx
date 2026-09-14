import type { ReactNode } from "react";
import { CategoryReturnPathGuard } from "./category-return-path-guard";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <>
      <CategoryReturnPathGuard />
      {children}
    </>
  );
}
