import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requestTenantContext } from "@/lib/request-context";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requestTenantContext();
  return <AppShell>{children}</AppShell>;
}
