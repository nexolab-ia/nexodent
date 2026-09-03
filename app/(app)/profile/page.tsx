import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { updateProfile } from "./actions";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() }) as unknown as {
    user?: { name?: string | null; email?: string | null } | null;
  } | null;
  const { updated } = await searchParams;
  return <main className="profile-page"><header><h1>Mi perfil</h1><p className="muted">Administra los datos visibles de tu cuenta.</p></header><form action={updateProfile} className="profile-form"><label>Nombre<input name="name" defaultValue={session?.user?.name ?? ""} minLength={2} maxLength={160} required /></label><label>Correo electrónico<input value={session?.user?.email ?? ""} readOnly aria-describedby="profile-email-help" /></label><small id="profile-email-help" className="muted">El correo de acceso no se modifica desde esta pantalla.</small><button type="submit">Guardar cambios</button>{updated === "1" && <p role="status" className="inline-notice">Perfil actualizado.</p>}</form></main>;
}
