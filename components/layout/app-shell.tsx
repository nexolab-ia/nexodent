import type { ReactNode } from "react";
import { AppNavigation } from "@/components/layout/app-navigation";
import { TopbarActions } from "@/components/layout/topbar-actions";
import type { ShellIdentity } from "@/features/tenant-identity/shell";

export function AppShell({ children, identity }: { children: ReactNode; identity: ShellIdentity }) {
  return <div className="app-shell"><header className="app-header"><div className="topbar"><a className="tenant-identity" href="/dashboard" title={identity.displayName}>{identity.displayName}</a><TopbarActions userName={identity.userName} email={identity.email} pendingNotifications={identity.pendingNotifications} /></div><AppNavigation variant="desktop" /></header><div className="app-content">{children}</div><AppNavigation variant="mobile" /></div>;
}
