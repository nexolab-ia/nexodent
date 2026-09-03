import type { ReactNode } from "react";
import { listActiveConvenios } from "@/app/(app)/patients/actions";
import { AppShell } from "@/components/layout/app-shell";
import { shellIdentity } from "@/features/tenant-identity/shell";
import { requestTenantContext } from "@/lib/request-context";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const actor = await requestTenantContext();
  const [identity, convenios] = await Promise.all([
    shellIdentity(actor),
    listActiveConvenios(),
  ]);
  return (
    <AppShell identity={identity} convenios={convenios}>
      {children}
    </AppShell>
  );
}
