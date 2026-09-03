import type { ConvenioOption } from "@/app/(app)/patients/actions";
import type { ReactNode } from "react";
import { AppNavigation } from "@/components/layout/app-navigation";
import { TopbarActions } from "@/components/layout/topbar-actions";
import type { ShellIdentity } from "@/features/tenant-identity/shell";

export function AppShell({
  children,
  identity,
  convenios,
}: {
  children: ReactNode;
  identity: ShellIdentity;
  convenios: ConvenioOption[];
}) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="topbar">
          <a
            className="tenant-identity"
            href="/dashboard"
            title={identity.displayName}
          >
            {identity.displayName}
          </a>
          <TopbarActions
            userName={identity.userName}
            email={identity.email}
            pendingNotifications={identity.pendingNotifications}
            convenios={convenios}
          />
        </div>
        <AppNavigation variant="desktop" />
      </header>
      <div className="app-content">{children}</div>
      <AppNavigation variant="mobile" />
    </div>
  );
}
