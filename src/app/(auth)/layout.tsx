import type { ReactNode } from "react";
import { AuthFlowProvider } from "@/features/auth/model/auth-flow-context";
import { AuthShell } from "@/shared/components/layout/auth-shell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthFlowProvider>
      <AuthShell>{children}</AuthShell>
    </AuthFlowProvider>
  );
}
