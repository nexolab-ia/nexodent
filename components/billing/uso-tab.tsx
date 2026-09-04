"use client";

type UsoTabProps = {
  account: { storageUsedKb: number; storageLimitGb: number; documents: number };
};

const weekdayLabels = ["D", "L", "M", "X", "J", "V", "S"];

function UsageIcon({ name }: { name: "folder" | "activity" }) {
  if (name === "folder") return <svg className="billing-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h6l2 2h10v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" /><path d="M3 11h18" /></svg>;
  return <svg className="billing-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16 5-5 4 3 7-8" /><path d="M15 6h5v5" /></svg>;
}

function getWeekDays() {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset, 12);
  return Array.from({ length: 7 }, (_, index) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index, 12));
}

function shortDate(date: Date) {
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(date).replace(".", "");
}

function monthYear() {
  const formatted = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function UsoTab({ account }: UsoTabProps) {
  const weekDays = getWeekDays();
  const month = monthYear();

  return <div className="billing-stack">
    <span className="billing-section-label">General</span>
    <section className="settings-card usage-storage-card">
      <header><h2><UsageIcon name="folder" />Almacenamiento de documentos</h2><p className="muted">Espacio usado por los documentos subidos a las fichas de tus pacientes.</p></header>
      <div className="storage-metrics"><span><strong className="tabular-number">{account.storageUsedKb} KB</strong> de {account.storageLimitGb} GB usados</span><span>{account.documents} documentos</span></div>
      <div className="usage-progress" aria-label={`${account.storageUsedKb} KB de ${account.storageLimitGb} GB usados`}><span /></div>
    </section>

    <span className="billing-section-label">IA</span>
    <section className="settings-card week-usage-card">
      <header><h2><UsageIcon name="activity" />Uso esta semana</h2><p className="muted">Créditos consumidos por día.</p></header>
      <div className="week-chart" role="img" aria-label="Cero créditos consumidos cada día de esta semana">
        {weekDays.map((day) => <div className="week-column" key={day.toISOString()}><span className="week-value">0</span><span className="week-bar-track"><span /></span><span className="week-day">{weekdayLabels[day.getDay()]}</span><span className="week-date">{shortDate(day)}</span></div>)}
      </div>
    </section>

    <section className="settings-card usage-detail-card">
      <header><h2><UsageIcon name="activity" />Detalle del consumo del mes</h2><p className="muted">Por funcionalidad y profesional · {month}</p></header>
      <div className="usage-empty-section"><span className="billing-overline">Por funcionalidad</span><p className="muted">Sin consumo todavía este mes.</p></div>
      <div className="usage-empty-section"><span className="billing-overline">Por profesional</span><p className="muted">Sin consumo por profesional este mes.</p></div>
    </section>
  </div>;
}
