"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../access.module.css";

export function RegistroForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      if (!response.ok) {
        setError(response.status === 409
          ? "Este email ya está registrado."
          : "No pudimos crear tu cuenta. Intenta nuevamente.");
        return;
      }

      router.replace("/bienvenida");
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
        Nombre
        <input name="name" type="text" autoComplete="name" required aria-invalid={Boolean(error)} />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required aria-invalid={Boolean(error)} />
      </label>
      <label>
        Contraseña
        <input name="password" type="password" autoComplete="new-password" minLength={8} required aria-invalid={Boolean(error)} />
      </label>
      {error ? <p className={styles.alert} role="alert">{error}</p> : null}
      <button type="submit" className={styles.primaryButton} disabled={loading} aria-busy={loading}>
        {loading ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
