import {SiteHeader} from "@/components/layout/site-header";

const modules = [
  ["Agenda", "Coordina horarios y profesionales sin cruces ni tiempos muertos."],
  ["Ficha", "La historia clínica de cada paciente, ordenada y siempre a mano."],
  ["Presupuestos", "Propuestas claras que compartes en un clic."],
  ["Cobros", "Saldos, abonos y cuenta corriente sin hojas sueltas."],
  ["Reportes IA", "Avisos que detectan oportunidades reales de tu clínica."],
  ["Recordatorios", "Menos ausencias gracias a comunicaciones bien consentidas."],
];

const agenda = [
  ["09:30", "Control · Camila R."],
  ["11:00", "Evaluación · Martín S."],
  ["15:30", "Tratamiento · Andrea P."],
];

export default function HomePage() {
  return (
    <>
      <SiteHeader/>
      <main className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>La clínica ordenada, el equipo tranquilo</h1>
            <p>Agenda, fichas, presupuestos y cobros en un solo lugar: seguro, con aislamiento por organización y pensado para la realidad chilena.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="/registro">Empezar 7 días gratis</a>
            </div>
          </div>
          <div className="dashboard-preview" aria-label="Vista previa de agenda">
            <h2>Agenda de hoy</h2>
            {agenda.map(([time,label]) => (
              <div className="preview-row" key={time}>
                <span className="mono">{time}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <div className="trust" aria-label="Condiciones del servicio">
        <span>Sin tarjeta</span>
        <span>Cancela cuando quieras</span>
        <span>Migración asistida</span>
        <span>Soporte real</span>
      </div>
      <main id="funcionalidades" className="module-section">
        <h2>Todo lo que tu equipo necesita para operar mejor</h2>
        <div className="module-grid">
          {modules.map(([title,copy]) => (
            <article className="module" key={title}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <h3>{title}</h3>
              <p className="muted">{copy}</p>
            </article>
          ))}
        </div>
        <section id="avisos" className="module-section">
          <h2>Avisos de tu clínica</h2>
          <article className="module">
            <strong>Sugerencia</strong>
            <p>Los martes entre 15:00 y 18:00 muestran disponibilidad recurrente. Revisa la evidencia antes de aplicar una acción.</p>
            <button type="button">Ver detalle</button>
          </article>
        </section>
      </main>
    </>
  );
}