import type { ReactNode } from "react";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="settings-layout">
      <SettingsNav />
      <div className="settings-content">{children}</div>
    </div>
  );
}
