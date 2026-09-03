"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconName = "dashboard" | "calendar" | "reports" | "settings";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/agenda", label: "Calendario", icon: "calendar" },
  { href: "/reports/insights", label: "Reportes", icon: "reports" },
  { href: "/settings", label: "Configuración", icon: "settings" },
] as const;

function NavIcon({ name }: { name: IconName }) {
  if (name === "dashboard") return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
  if (name === "calendar") return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>;
  if (name === "reports") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>;
}

export function AppNavigation({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  return (
    <nav className={variant === "desktop" ? "primary-nav" : "bottom-tabs"} aria-label="Navegación principal">
      <div className="primary-nav-inner">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`) || (href === "/reports/insights" && pathname.startsWith("/reports"));
          return <Link key={href} href={href} aria-current={active ? "page" : undefined}><NavIcon name={icon}/><span>{label}</span></Link>;
        })}
      </div>
    </nav>
  );
}
