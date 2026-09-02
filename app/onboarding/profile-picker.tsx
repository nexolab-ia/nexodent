"use client";

import { useState } from "react";
import styles from "../access.module.css";

type ProfileId = "professional" | "clinic" | "join";

const profiles: Array<{ id: ProfileId; title: string; description: string; detail: string; icon: "person" | "building" | "community" }> = [
  {
    id: "professional",
    title: "Soy profesional independiente",
    description: "Gestiona tu consulta solo: agenda, pacientes, presupuestos y cobros en un mismo lugar.",
    detail: "Perfecto para empezar solo. En la próxima fase configurarás tu consulta, sede y agenda.",
    icon: "person",
  },
  {
    id: "clinic",
    title: "Tengo una clínica",
    description: "Administra tu clínica con tu equipo: sedes, roles y operación completa.",
    detail: "Perfecto para equipos. En la próxima fase crearás tu clínica e invitarás a tu equipo.",
    icon: "building",
  },
  {
    id: "join",
    title: "Quiero unirme a un espacio existente",
    description: "Entra a una clínica o consulta que ya usa NexoDent con un código de invitación.",
    detail: "En la próxima fase ingresarás el código de invitación de tu espacio.",
    icon: "community",
  },
];

function ProfileIcon({ type }: { type: "person" | "building" | "community" }) {
  if (type === "building") return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 28V8h18v20M4 28h24M12 13h2m4 0h2m-8 5h2m4 0h2m-8 5h8v5" /></svg>;
  if (type === "community") return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 16a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm10-2a4 4 0 1 0 0-8m-19 22v-3a9 9 0 0 1 18 0v3m1-10a8 8 0 0 1 9 8v2" /></svg>;
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM5 28v-2a11 11 0 0 1 22 0v2M22 8h6m-3-3v6" /></svg>;
}

export function ProfilePicker() {
  const [selected, setSelected] = useState<ProfileId | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const selectedProfile = profiles.find((profile) => profile.id === selected);

  function selectProfile(id: ProfileId) {
    setSelected(id);
    setSubmitted(false);
  }

  return (
    <div className={styles.profilePicker}>
      <div className={styles.profileGrid} aria-label="Tipos de espacio">
        {profiles.map((profile) => {
          const active = selected === profile.id;
          return (
            <button
              key={profile.id}
              type="button"
              className={`${styles.profileOption} ${active ? styles.profileOptionActive : ""}`}
              aria-pressed={active}
              onClick={() => selectProfile(profile.id)}
            >
              <span className={styles.profileIcon}><ProfileIcon type={profile.icon} /></span>
              <span className={styles.profileCopy}>
                <strong>{profile.title}</strong>
                <span>{profile.description}</span>
              </span>
              <span className={styles.check} aria-hidden="true">✓</span>
            </button>
          );
        })}
      </div>
      <div className={styles.profileDetail} aria-live="polite">
        <strong>Acorde a tu perfil</strong>
        <p>{submitted ? "La configuración de tu perfil estará disponible pronto." : selectedProfile?.detail ?? "Selecciona una opción para ver qué sigue."}</p>
      </div>
      <button type="button" className={styles.primaryButton} disabled={!selected} onClick={() => setSubmitted(true)}>
        Continuar
      </button>
    </div>
  );
}
