import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { auth } from "@/lib/auth";
import { ProfilePicker } from "./profile-picker";
import styles from "../access.module.css";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Logo />
        <Link href="/" className={styles.backLink}>Volver al inicio</Link>
      </header>
      <main className={styles.main}>
        <section className={`${styles.card} ${styles.wideCard}`} aria-label="Configuración inicial de NexoDent">
          <ProfilePicker />
        </section>
      </main>
    </div>
  );
}
