"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  createPatientFromTopbar,
  searchPatients,
  type ConvenioOption,
  type PatientSearchResult,
} from "@/app/(app)/patients/actions";
import { signOut } from "@/app/(app)/profile/actions";
import { COUNTRY_OPTIONS } from "@/app/onboarding/regions";

type IconName = "search" | "plus" | "calendar-plus" | "bell" | "profile";
function ActionIcon({ name }: { name: IconName }) {
  if (name === "search")
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  if (name === "plus")
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  if (name === "calendar-plus")
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18M12 14v4M10 16h4" />
      </svg>
    );
  if (name === "bell")
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </svg>
    );
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function TopbarActions({
  userName,
  email,
  pendingNotifications,
  convenios,
}: {
  userName: string;
  email: string;
  pendingNotifications: number;
  convenios: ConvenioOption[];
}) {
  const regions = COUNTRY_OPTIONS[0].regions;
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tab, setTab] = useState<"personal" | "dental">("personal");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [isSearching, startSearch] = useTransition();
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const patientDialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    function closeMenus(event: MouseEvent) {
      const target = event.target as Node;
      if (!searchRef.current?.contains(target)) setSearchOpen(false);
      if (!profileRef.current?.contains(target)) setProfileOpen(false);
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);
  function runSearch(value: string) {
    setQuery(value);
    setSearchOpen(true);
    if (value.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    startSearch(async () => {
      setResults(await searchPatients(value));
      setSearched(true);
    });
  }
  function newAppointment() {
    if (pathname === "/agenda")
      document
        .getElementById("new-appointment")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    else router.push("/agenda#new-appointment");
  }
  return (
    <>
      <div className="topbar-actions" aria-label="Acciones globales">
        <div className="topbar-popover" ref={searchRef}>
          <button
            className="icon-button"
            type="button"
            aria-label="Buscar paciente"
            title="Buscar paciente"
            aria-expanded={searchOpen}
            aria-controls="patient-search"
            onClick={() => setSearchOpen((open) => !open)}
          >
            <ActionIcon name="search" />
          </button>
          {searchOpen && (
            <div className="action-popover search-popover" id="patient-search">
              <label htmlFor="global-patient-search">
                Buscar por nombre o RUT
              </label>
              <input
                id="global-patient-search"
                type="search"
                value={query}
                onChange={(event) => runSearch(event.target.value)}
                placeholder="Ej. Emilia o 12.345.678-5"
                autoFocus
                aria-describedby="patient-search-help"
              />
              <small id="patient-search-help" className="muted">
                Ingresa al menos 2 caracteres.
              </small>
              <div className="search-results" aria-live="polite">
                {isSearching ? (
                  <p>Buscando pacientes…</p>
                ) : results.length ? (
                  <ul>
                    {results.map((patient) => (
                      <li key={patient.id}>
                        <Link
                          href={`/patients/${patient.id}`}
                          onClick={() => setSearchOpen(false)}
                        >
                          <strong>{patient.name}</strong>
                          {patient.rut && (
                            <span className="mono">{patient.rut}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : searched ? (
                  <p>No encontramos pacientes. Revisa el nombre o RUT.</p>
                ) : null}
              </div>
            </div>
          )}
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="Nuevo paciente"
          title="Nuevo paciente"
          onClick={() => patientDialog.current?.showModal()}
        >
          <ActionIcon name="plus" />
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label="Nueva cita"
          title="Nueva cita"
          onClick={newAppointment}
        >
          <ActionIcon name="calendar-plus" />
        </button>
        <Link
          className="icon-button"
          href="/reports/insights"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <ActionIcon name="bell" />
          {pendingNotifications > 0 && (
            <span
              className="notification-badge"
              aria-label={`${pendingNotifications} notificaciones pendientes`}
            >
              {pendingNotifications > 99 ? "99+" : pendingNotifications}
            </span>
          )}
        </Link>
        <div className="topbar-popover" ref={profileRef}>
          <button
            className="icon-button"
            type="button"
            aria-label="Perfil"
            title="Perfil"
            aria-expanded={profileOpen}
            aria-controls="profile-menu"
            onClick={() => setProfileOpen((open) => !open)}
          >
            <ActionIcon name="profile" />
          </button>
          {profileOpen && (
            <div
              className="action-popover profile-menu"
              id="profile-menu"
              role="menu"
            >
              <header>
                <strong>{userName}</strong>
                <span>{email}</span>
              </header>
              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setProfileOpen(false)}
              >
                Mi perfil
              </Link>
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setProfileOpen(false)}
              >
                Mi configuración
              </Link>
              <form action={signOut}>
                <button type="submit" role="menuitem">
                  Cerrar sesión
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      <dialog
        className="patient-dialog"
        ref={patientDialog}
        aria-labelledby="new-patient-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <form action={createPatientFromTopbar} className="patient-form">
          <header className="drawer-heading">
            <div>
              <h2 id="new-patient-title">Nuevo paciente</h2>
              <p>Completa la información de la ficha.</p>
            </div>
            <button
              className="icon-button"
              type="button"
              aria-label="Cerrar alta de paciente"
              title="Cerrar"
              onClick={() => patientDialog.current?.close()}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>
          <div
            className="drawer-tabs"
            role="tablist"
            aria-label="Secciones de la ficha"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "personal"}
              aria-controls="tab-personal"
              id="tab-personal-btn"
              onClick={() => setTab("personal")}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
              Información personal
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "dental"}
              aria-controls="tab-dental"
              id="tab-dental-btn"
              onClick={() => setTab("dental")}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M8 3c-3 0-5 2-5 5 0 2 1 4 2 6l2 6c.3 1 1.5 1 2 0l1-4c.5-2 3.5-2 4 0l1 4c.5 1 1.7 1 2 0l2-6c1-2 2-4 2-6 0-3-2-5-5-5-2 0-3 1-4 1S10 3 8 3Z" />
              </svg>
              Información odontológica
            </button>
          </div>
          <div className="drawer-body">
            <section
              id="tab-personal"
              role="tabpanel"
              aria-labelledby="tab-personal-btn"
              hidden={tab !== "personal"}
            >
              <div className="form-row">
                <label>
                  Nombres
                  <input name="firstName" autoComplete="given-name" required />
                </label>
                <label>
                  Apellidos
                  <input name="lastName" autoComplete="family-name" required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  RUT
                  <input
                    name="rut"
                    autoComplete="off"
                    placeholder="12.345.678-5"
                  />
                </label>
                <label>
                  Sexo
                  <select name="sex" defaultValue="">
                    <option value="">Selecciona una opción</option>
                    <option value="female">Femenino</option>
                    <option value="male">Masculino</option>
                    <option value="other">Otro</option>
                    <option value="unspecified">Prefiere no indicar</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Fecha de nacimiento
                  <input
                    type="date"
                    name="birthDate"
                    max={new Intl.DateTimeFormat("en-CA", {
                      timeZone: "America/Santiago",
                    }).format(new Date())}
                  />
                </label>
                <label>
                  Correo electrónico
                  <input name="email" type="email" autoComplete="email" />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Teléfono principal
                  <input name="phone" type="tel" autoComplete="tel" />
                </label>
                <label>
                  Teléfono secundario
                  <input name="phoneSecondary" type="tel" />
                </label>
              </div>
              <label className="field-full">
                Ciudad
                <select name="city" defaultValue="">
                  <option value="" disabled>
                    Selecciona una ciudad…
                  </option>
                  {regions.map((region) => (
                    <optgroup key={region.id} label={region.label}>
                      {region.cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="field-full">
                Dirección
                <input name="address" autoComplete="street-address" />
              </label>
            </section>
            <section
              id="tab-dental"
              role="tabpanel"
              aria-labelledby="tab-dental-btn"
              hidden={tab !== "dental"}
            >
              <label>
                Convenio
                <select name="convenioId" defaultValue="">
                  <option value="">Sin convenio</option>
                  {convenios.map((convenio) => (
                    <option key={convenio.id} value={convenio.id}>
                      {convenio.name}
                    </option>
                  ))}
                </select>
                <small className="muted">
                  Selecciona el convenio si el paciente pertenece a uno (FONASA,
                  isapre, empresa).
                </small>
              </label>
              <label className="field-full">
                Observaciones generales
                <textarea
                  name="observations"
                  rows={6}
                  maxLength={2000}
                  placeholder="Alergias, antecedentes y cualquier observación de la ficha."
                />
              </label>
            </section>
          </div>
          <footer className="drawer-footer">
            <label className="consent-field">
              <input name="consentGranted" type="checkbox" required /> El
              paciente autoriza el registro de sus datos.
            </label>
            <div className="drawer-actions">
              <button
                type="button"
                className="button"
                onClick={() => patientDialog.current?.close()}
              >
                Cancelar
              </button>
              <button type="submit" className="button button-primary">
                Crear paciente
              </button>
            </div>
          </footer>
        </form>
      </dialog>
    </>
  );
}
