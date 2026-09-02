import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { auth } from "@/lib/auth";
import { activeMembershipForUserOrNull } from "@/lib/auth";
import { RegistroForm } from "./registro-form";
import styles from "../access.module.css";

export default async function RegistroPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    // Con sesión activa, redirige según el estado: si ya tiene un espacio
    // configurado va directo a su área; si no, completa el onboarding.
    const membership = await activeMembershipForUserOrNull(session.user.id);
    redirect(membership ? "/agenda" : "/onboarding");
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Logo />
        <Link href="/" className={styles.backLink}>Volver al inicio</Link>
      </header>
      <main className={styles.main}>
        <section className={styles.card} aria-labelledby="registro-title">
          <div className={styles.heading}>
            <h1 id="registro-title">Crea tu cuenta NexoDent</h1>
            <p>Empieza a ordenar tu clínica o consulta en minutos.</p>
          </div>
          <RegistroForm />
          <p className={styles.demoLink}>¿Ya tienes cuenta? <Link href="/login">Entra</Link></p>
        </section>
      </main>
    </div>
  );
}
