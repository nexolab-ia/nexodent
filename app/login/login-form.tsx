"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../access.module.css";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      if (!response.ok) {
        setError(response.status === 401 ? "Email o contraseña incorrectos" : "No pudimos iniciar sesión. Intenta nuevamente.");
        return;
      }
      router.replace("/agenda");
      router.refresh();
    } catch {
      setError("No pudimos conectar con NexoDent. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required aria-invalid={Boolean(error)} />
      </label>
      <label>
        Contraseña
        <input name="password" type="password" autoComplete="current-password" required aria-invalid={Boolean(error)} />
      </label>
      {error ? <p className={styles.alert} role="alert">{error}</p> : null}
      <button type="submit" className={styles.primaryButton} disabled={loading} aria-busy={loading}>
        {loading ? "Ingresando…" : "Entrar"}
      </button>
    </form>
  );
}
