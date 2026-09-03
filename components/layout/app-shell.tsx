import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { AppNavigation } from "@/components/layout/app-navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="topbar">
          <Logo />
          <div className="topbar-actions">
            <span className="muted">Avisos de tu clínica</span>
            <a className="button" href="/login">Perfil</a>
          </div>
        </div>
        <AppNavigation variant="desktop" />
      </header>
      <div className="app-content">{children}</div>
      <AppNavigation variant="mobile" />
    </div>
  );
}
