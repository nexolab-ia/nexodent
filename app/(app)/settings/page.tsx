import Link from "next/link";

const settingsLinks = [
  ["/settings/members", "Equipo", "Administra los accesos y roles de la clínica."],
  ["/settings/sites", "Sedes", "Configura las ubicaciones de atención."],
  ["/settings/notifications", "Notificaciones", "Revisa el estado de las comunicaciones."],
  ["/migration", "Migración de datos", "Importa información desde tu sistema anterior."],
] as const;

export default function SettingsPage() {
  return <main className="settings-page"><header><h1>Configuración</h1><p className="muted">Administra la clínica y sus preferencias.</p></header><nav className="settings-links" aria-label="Opciones de configuración">{settingsLinks.map(([href,label,description])=><Link key={href} href={href}><strong>{label}</strong><span>{description}</span><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></Link>)}</nav></main>;
}
