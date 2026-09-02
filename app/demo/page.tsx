import { FICTIONAL_DATA_MARKER, demoPatients } from "@/db/fixtures/demo";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { auth } from "@/lib/auth";
import styles from "../access.module.css";

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [session, query] = await Promise.all([auth.api.getSession({ headers: await headers() }), searchParams]);
  if (session) redirect("/agenda");

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Logo />
        <Link href="/" className={styles.backLink}>Volver al inicio</Link>
      </header>
      <main className={styles.main}>
        <section className={styles.card} aria-labelledby="demo-title">
          <p className={styles.notice}>{FICTIONAL_DATA_MARKER} — solo demostración</p>
          <div className={styles.heading}>
            <h1 id="demo-title">Conoce NexoDent en acción</h1>
            <p>Recorre una clínica preparada para que explores el flujo completo.</p>
          </div>
          <div className={styles.clinic}>
            <h2>Clínica Sonrisa Andes</h2>
            <p>Providencia y Ñuñoa</p>
            <p>{demoPatients.length} pacientes ficticios</p>
          </div>
          {query.error ? <p className={styles.alert} role="alert">La demo no está disponible. Contacta a soporte para recibir ayuda.</p> : null}
          <form action="/api/demo/sign-in" method="post" className={styles.form}>
            <button type="submit" className={styles.primaryButton}>Explorar la demo</button>
          </form>
          <p className={styles.demoLink}>¿Ya tienes una cuenta? <Link href="/login">Ingresa acá</Link></p>
        </section>
      </main>
    </div>
  );
}
