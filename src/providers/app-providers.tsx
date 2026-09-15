"use client";

import type { ReactNode } from "react";
import { CategoryReturnPathGuard } from "./category-return-path-guard";
import { AuthProvider } from "./auth-provider";
import { MswProvider } from "./msw-provider";
import { QueryProvider } from "./query-provider";

type AppProvidersProps = {
  children: ReactNode;
  mswForceEnabled?: boolean;
};

export function AppProviders({ children, mswForceEnabled }: AppProvidersProps) {
  return (
    <MswProvider forceEnabled={mswForceEnabled}>
      <QueryProvider>
        <AuthProvider>
          <CategoryReturnPathGuard />
          {children}
        </AuthProvider>
      </QueryProvider>
    </MswProvider>
  );
}
