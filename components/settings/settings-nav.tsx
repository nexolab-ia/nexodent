"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export const SETTINGS_SECTIONS = [
  {
    key: "clinic",
    label: "Mi clínica",
    items: [
      { href: "/settings/organizacion", label: "Organización", icon: "building" },
      { href: "/settings/plan", label: "Plan", icon: "card" },
      { href: "/settings/usuarios", label: "Usuarios y permisos", icon: "users" },
    ],
  },
] as const;

type SettingsIcon = (typeof SETTINGS_SECTIONS)[number]["items"][number]["icon"];

const iconPaths: Record<SettingsIcon, ReactNode> = {
  building: <><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M3 21h18"/></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
};

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Configuración" className="settings-nav">
      {SETTINGS_SECTIONS.map((section) => (
        <div className="settings-nav-section" key={section.key}>
          <p className="settings-group">{section.label}</p>
          <div className="settings-nav-items">
            {section.items.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link href={item.href} key={item.href} aria-current={isActive ? "page" : undefined}>
                  <svg aria-hidden="true" viewBox="0 0 24 24">{iconPaths[item.icon]}</svg>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
