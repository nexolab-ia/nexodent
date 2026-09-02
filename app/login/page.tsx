import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";
import styles from "../access.module.css";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Logo />
        <Link href="/" className={styles.backLink}>Volver al inicio</Link>
      </header>
      <main className={styles.main}>
        <section className={styles.card} aria-labelledby="login-title">
          <div className={styles.heading}>
            <h1 id="login-title">Entra a tu clínica</h1>
            <p>Gestiona agenda, pacientes y operación desde un solo lugar.</p>
          </div>
          <LoginForm />
          <p className={styles.demoLink}>¿Aún no tienes cuenta? <Link href="/registro">Crea una gratis</Link></p>
        </section>
      </main>
    </div>
  );
}
