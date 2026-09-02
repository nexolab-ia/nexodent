import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { auth } from "@/lib/auth";
import styles from "../access.module.css";

export default async function BienvenidaPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const name = session.user?.name?.split(" ")[0] ?? "";

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Logo />
        <Link href="/" className={styles.backLink}>Volver al inicio</Link>
      </header>
      <main className={styles.main}>
        <section className={`${styles.card} ${styles.welcomeCard}`} aria-labelledby="bienvenida-title">
          <svg className={styles.welcomeIcon} width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
            <path d="M18 29V15a4 4 0 0 1 8 0v10-15a4 4 0 0 1 8 0v15-11a4 4 0 0 1 8 0v17c0 9-6 16-15 16h-2c-6 0-10-3-14-8l-5-7a4 4 0 0 1 6-5l6 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m8 10 3 2M16 4l1 4M5 19l4 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div className={styles.heading}>
            <h1 id="bienvenida-title">¡Hola, {name}!</h1>
            <p className={styles.welcomeLead}>Vamos a personalizar tu experiencia para que NexoDent se adapte a cómo trabajas.</p>
          </div>
          <p className={styles.detail}>Responde una pregunta y en menos de un minuto tendrás tu espacio listo.</p>
          <Link href="/onboarding" className={`${styles.primaryButton} ${styles.buttonLink}`}>Elegir mi perfil</Link>
        </section>
      </main>
    </div>
  );
}
