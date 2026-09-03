import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { shellIdentity } from "@/features/tenant-identity/shell";
import { requestTenantContext } from "@/lib/request-context";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const actor = await requestTenantContext();
  const identity = await shellIdentity(actor);
  return <AppShell identity={identity}>{children}</AppShell>;
}
