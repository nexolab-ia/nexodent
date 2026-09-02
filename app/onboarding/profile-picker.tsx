"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import styles from "../access.module.css";

type ProfileId = "professional" | "clinic" | "join";
type FieldName = "name" | "country" | "city" | "address" | "primaryPhone" | "secondaryPhone" | "email" | "accepted";
type Errors = Partial<Record<FieldName, string>>;

const profiles: Array<{ id: ProfileId; title: string; description: string; detail: string; icon: "person" | "building" | "community" }> = [
  { id: "professional", title: "Soy profesional independiente", description: "Gestiona tu consulta solo: agenda, pacientes, presupuestos y cobros en un mismo lugar.", detail: "Configura la información principal de tu consulta particular.", icon: "person" },
  { id: "clinic", title: "Tengo una clínica", description: "Administra tu clínica con tu equipo: sedes, roles y operación completa.", detail: "Configura la información principal de tu clínica.", icon: "building" },
  { id: "join", title: "Quiero unirme a un espacio existente", description: "Entra a una clínica o consulta que ya usa NexoDent mediante una invitación.", detail: "Conoce los pasos para solicitar acceso al administrador de tu clínica.", icon: "community" },
];

function ProfileIcon({ type }: { type: "person" | "building" | "community" }) {
  if (type === "building") return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 28V8h18v20M4 28h24M12 13h2m4 0h2m-8 5h2m4 0h2m-8 5h8v5" /></svg>;
  if (type === "community") return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 16a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm10-2a4 4 0 1 0 0-8m-19 22v-3a9 9 0 0 1 18 0v3m1-10a8 8 0 0 1 9 8v2" /></svg>;
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM5 28v-2a11 11 0 0 1 22 0v2M22 8h6m-3-3v6" /></svg>;
}

function Field({ name, label, type = "text", placeholder, optional, error }: { name: FieldName; label: string; type?: "text" | "tel" | "email"; placeholder?: string; optional?: boolean; error?: string }) {
  const errorId = `${name}-error`;
  return <label className={styles.profileField}>
    <span>{label}{optional && <small> (opcional)</small>}</span>
    <input name={name} type={type} placeholder={placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />
    {error && <small id={errorId} className={styles.fieldError} role="alert">{error}</small>}
  </label>;
}

function SetupForm({ profile, onBack }: { profile: "professional" | "clinic"; onBack: () => void }) {
  const [errors, setErrors] = useState<Errors>({});
  const [complete, setComplete] = useState(false);
  const isClinic = profile === "clinic";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextErrors: Errors = {};
    const required: Array<[FieldName, string]> = [
      ["name", isClinic ? "Ingresa el nombre de la clínica." : "Ingresa el nombre de la consulta."],
      ["country", "Ingresa el país."], ["city", "Ingresa la ciudad."], ["address", "Ingresa la dirección."],
      ["primaryPhone", "Ingresa el teléfono principal."], ["email", "Ingresa el email de contacto."],
    ];
    required.forEach(([name, message]) => { if (!String(data.get(name) ?? "").trim()) nextErrors[name] = message; });
    const phonePattern = /^[\d +-]{6,20}$/;
    const primaryPhone = String(data.get("primaryPhone") ?? "").trim();
    const secondaryPhone = String(data.get("secondaryPhone") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    if (primaryPhone && !phonePattern.test(primaryPhone)) nextErrors.primaryPhone = "Usa entre 6 y 20 dígitos, espacios, + o -.";
    if (secondaryPhone && !phonePattern.test(secondaryPhone)) nextErrors.secondaryPhone = "Usa entre 6 y 20 dígitos, espacios, + o -.";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Ingresa un email válido.";
    if (data.get("accepted") !== "on") nextErrors.accepted = "Debes aceptar las políticas y los términos para continuar.";
    setErrors(nextErrors);
    setComplete(Object.keys(nextErrors).length === 0);
  }

  return <div className={styles.profileScreen}>
    <button type="button" className={styles.inlineBack} onClick={onBack}>← Volver</button>
    <div className={styles.heading}>
      <h1>{isClinic ? "Vamos a configurar tu clínica" : "Vamos a configurar tu consulta particular"}</h1>
      <p>{isClinic ? "Completa la información de tu clínica. Podrás editarla después." : "Completa la información de tu consulta. Podrás editarla después."}</p>
    </div>
    {complete ? <div className={styles.successPanel} role="status">
      <strong>Configuración lista</strong>
      <p>Tu {isClinic ? "clínica" : "consulta"} quedó configurada. En la próxima versión conectaremos tu espacio.</p>
      <button type="button" className={styles.secondaryButton} onClick={onBack}>Elegir otro perfil</button>
    </div> : <form className={styles.profileForm} onSubmit={handleSubmit} noValidate>
      <div className={styles.formGrid}>
        <Field name="name" label={isClinic ? "Nombre de la clínica" : "Nombre"} error={errors.name} />
        <Field name="country" label="País" placeholder="Chile" error={errors.country} />
        <Field name="city" label="Ciudad" error={errors.city} />
        <Field name="address" label="Dirección" error={errors.address} />
        <Field name="primaryPhone" label="Teléfono principal" type="tel" error={errors.primaryPhone} />
        <Field name="secondaryPhone" label="Teléfono secundario" type="tel" optional error={errors.secondaryPhone} />
        <Field name="email" label="Email de contacto" type="email" error={errors.email} />
      </div>
      <fieldset className={styles.consentField} aria-invalid={Boolean(errors.accepted)} aria-describedby={errors.accepted ? "accepted-error" : undefined}>
        <legend>Consentimiento</legend>
        <label><input name="accepted" type="checkbox" /> <span>Acepto las <Link href="/#privacidad">Políticas de Privacidad</Link> y los <Link href="/#terminos">Términos y Condiciones</Link> de NexoDent</span></label>
        {errors.accepted && <small id="accepted-error" className={styles.fieldError} role="alert">{errors.accepted}</small>}
      </fieldset>
      <button type="submit" className={styles.primaryButton}>{isClinic ? "Crear mi clínica" : "Crear mi consulta"}</button>
    </form>}
  </div>;
}

function JoinSteps({ onBack }: { onBack: () => void }) {
  const steps = [
    ["Contacta al administrador de tu clínica", "pide acceso a NexoDent."],
    ["Solicita una invitación", "el administrador te enviará una invitación a tu correo."],
    ["Acepta la invitación", "y ya podrás acceder al sistema."],
  ];
  return <div className={styles.profileScreen}>
    <button type="button" className={styles.inlineBack} onClick={onBack}>← Volver</button>
    <div className={styles.heading}><h1>Únete a tu clínica en tres pasos</h1><p>Solicita acceso al equipo que ya usa NexoDent.</p></div>
    <ol className={styles.stepsList}>
      {steps.map(([title, copy], index) => <li key={title}>
        <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
        <span className={styles.stepIcon} aria-hidden="true">
          {index === 0 && <svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0m1-9v6m-3-3h6" /></svg>}
          {index === 1 && <svg viewBox="0 0 24 24"><path d="M3 6h18v13H3zM3 7l9 7 9-7" /></svg>}
          {index === 2 && <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6M4 21h16" /></svg>}
        </span>
        <div><strong>{title}</strong><p>{copy}</p></div>
      </li>)}
    </ol>
    <button type="button" className={styles.primaryButton} onClick={onBack}>Entendido</button>
  </div>;
}

export function ProfilePicker() {
  const [selected, setSelected] = useState<ProfileId | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const selectedProfile = profiles.find((profile) => profile.id === selected);
  const backToPicker = () => setShowSetup(false);

  if (showSetup && selected === "professional") return <SetupForm profile="professional" onBack={backToPicker} />;
  if (showSetup && selected === "clinic") return <SetupForm profile="clinic" onBack={backToPicker} />;
  if (showSetup && selected === "join") return <JoinSteps onBack={backToPicker} />;

  return <div className={styles.profilePicker}>
    <div className={styles.heading}><h1>¿Qué tipo de espacio quieres configurar?</h1><p>Elige la opción que mejor describa cómo trabajas.</p></div>
    <div className={styles.profileGrid} aria-label="Tipos de espacio">
      {profiles.map((profile) => {
        const active = selected === profile.id;
        return <button key={profile.id} type="button" className={`${styles.profileOption} ${active ? styles.profileOptionActive : ""}`} aria-pressed={active} onClick={() => setSelected(profile.id)}>
          <span className={styles.profileIcon}><ProfileIcon type={profile.icon} /></span>
          <span className={styles.profileCopy}><strong>{profile.title}</strong><span>{profile.description}</span></span>
          <span className={styles.check} aria-hidden="true">✓</span>
        </button>;
      })}
    </div>
    <div className={styles.profileDetail} aria-live="polite"><strong>Acorde a tu perfil</strong><p>{selectedProfile?.detail ?? "Selecciona una opción para ver qué sigue."}</p></div>
    <button type="button" className={styles.primaryButton} disabled={!selected} onClick={() => setShowSetup(true)}>Continuar</button>
  </div>;
}
