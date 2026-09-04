"use client";

import { useEffect, useState } from "react";
import { formatClp, formatDate, PROFESSIONAL_ADDON_PRICE, type PeriodOption } from "./use-billing-demo";

type PlanAccount = { expiresAt: Date; daysRemaining: number; professionals: number; assistants: string; monthlyPrice: number };
type Payment = { id: string; date: Date; concept: string; amount: number; method: "MercadoPago" };
type PlanTabProps = {
  account: PlanAccount;
  periods: PeriodOption[];
  payments: Payment[];
  onPay: (period: PeriodOption) => Promise<{ expiresAt: Date }>;
  onAddProfessional: (count: number) => Promise<{ professionals: number; total: number }>;
};

function LineIcon({ name }: { name: "refresh" | "user-plus" | "info" | "wallet" | "chevron" | "check" }) {
  const paths = {
    refresh: <><path d="M20 11a8 8 0 1 0 2 5.3" /><path d="M20 4v7h-7" /></>,
    "user-plus": <><circle cx="9" cy="7" r="4" /><path d="M3 21a6 6 0 0 1 12 0M19 8v6M16 11h6" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    wallet: <><path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13" /><path d="M16 13h5M16 13a1 1 0 1 0 0 .01" /></>,
    chevron: <path d="m8 10 4 4 4-4" />,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg className="billing-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function professionalLabel(count: number) {
  return `${count} ${count === 1 ? "profesional" : "profesionales"}`;
}

function formatProrationFactor(daysRemaining: number) {
  const options = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    roundingMode: "trunc",
  } as Intl.NumberFormatOptions & { roundingMode: "trunc" };
  return new Intl.NumberFormat("es-CL", options).format(daysRemaining / 30);
}

function remainingTime(daysRemaining: number) {
  const months = Math.floor(daysRemaining / 30);
  const days = daysRemaining % 30;
  if (months === 0) return `${days} ${days === 1 ? "día" : "días"}`;
  if (days === 0) return `${months} ${months === 1 ? "mes" : "meses"}`;
  return `${months} ${months === 1 ? "mes" : "meses"} y ${days} ${days === 1 ? "día" : "días"}`;
}

function TransferPanel({ amount }: { amount: number }) {
  const fields = [
    ["Banco", "Banco Estado"], ["Tipo de cuenta", "Corriente"], ["N° de cuenta", "12345678"],
    ["Titular", "Clínica Sonrisa Andes SpA"], ["RUT", "76.543.210-8"], ["Email de aviso", "pagos@nexodent.invalid"],
  ];
  return <div className="transfer-panel">
    <header><strong>Datos para transferir</strong><p className="muted">El plan se activa al confirmar la transferencia (1 a 2 días hábiles).</p></header>
    <div className="transfer-fields">{fields.map(([label, value]) => <div key={label}><span className="billing-overline">{label}</span><strong>{value}</strong></div>)}</div>
    <strong className="transfer-amount tabular-number">Transfiere exactamente {formatClp(amount)}</strong>
    <p className="muted transfer-note">Datos de demostración — se reemplazarán por la cuenta real de tu clínica al conectar la pasarela.</p>
  </div>;
}

function TransferToggle({ amount }: { amount: number }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="billing-transfer-button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>Pagar por transferencia<LineIcon name="chevron" /></button>
    {open && <TransferPanel amount={amount} />}
  </>;
}

export function PlanTab({ account, periods, payments, onPay, onAddProfessional }: PlanTabProps) {
  const [planView, setPlanView] = useState<"renew" | "add">("renew");
  const [selectedPeriodId, setSelectedPeriodId] = useState(periods[0].id);
  const [addCount, setAddCount] = useState(1);
  const [isPaying, setIsPaying] = useState(false);
  const [renewSuccess, setRenewSuccess] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) ?? periods[0];
  const addonMonthly = PROFESSIONAL_ADDON_PRICE * addCount;
  const proportionalTotal = Math.round(addonMonthly * (account.daysRemaining / 30));
  const futureProfessionals = account.professionals + addCount;

  useEffect(() => { setSelectedPeriodId(periods[0].id); }, [periods]);

  async function handleRenewPayment() {
    setIsPaying(true); setRenewSuccess(null);
    try {
      const result = await onPay(selectedPeriod);
      setRenewSuccess(`Pago exitoso — tu plan quedó renovado hasta el ${formatDate(result.expiresAt)}.`);
    } finally { setIsPaying(false); }
  }

  async function handleAddPayment() {
    const count = addCount;
    setIsPaying(true); setAddSuccess(null);
    try {
      await onAddProfessional(count);
      setAddSuccess(`Pago exitoso — agregaste ${count} ${count === 1 ? "profesional adicional" : "profesionales adicionales"} hasta el ${formatDate(account.expiresAt)}.`);
      setAddCount(1);
    } finally { setIsPaying(false); }
  }

  return <div className="billing-stack">
    <section className="settings-card plan-overview-card">
      <header className="plan-overview-heading"><div><h2>Mi plan actual</h2><p className="muted">Vence el {formatDate(account.expiresAt)}</p></div><span className="badge-active"><span aria-hidden="true" />Activo</span></header>
      <div className="plan-stats-grid">
        <div className="plan-stat"><span className="plan-stat-label">Profesionales</span><strong className="stat-number">{account.professionals}</strong><span className="muted">{account.professionals} en uso</span><span className="professional-progress" aria-label={`${account.professionals} de ${account.professionals} profesionales en uso`}><span /></span></div>
        <div className="plan-stat"><span className="plan-stat-label">Días restantes</span><strong className="stat-number">{account.daysRemaining}</strong></div>
        <div className="plan-stat"><span className="plan-stat-label">Asistentes</span><strong className="stat-number stat-text">{account.assistants}</strong></div>
      </div>
    </section>

    <div className="plan-subtabs" role="tablist" aria-label="Acciones del plan">
      <button id="plan-renew-tab" type="button" role="tab" aria-selected={planView === "renew"} aria-controls="plan-renew-panel" className={planView === "renew" ? "is-active" : ""} onClick={() => setPlanView("renew")}><LineIcon name="refresh" />Renovar plan</button>
      <button id="plan-add-tab" type="button" role="tab" aria-selected={planView === "add"} aria-controls="plan-add-panel" className={planView === "add" ? "is-active" : ""} onClick={() => setPlanView("add")}><LineIcon name="user-plus" />Agregar profesionales</button>
    </div>

    <><div id="plan-renew-panel" role="tabpanel" aria-labelledby="plan-renew-tab" className="billing-grid" hidden={planView !== "renew"}>
      <section className="settings-card plan-detail-card">
        <header><h2>Detalle de tu plan</h2><p className="muted">Composición del precio mensual.</p></header>
        <div className="plan-professionals-row"><div><strong>Profesionales</strong><p className="muted">Renueva tu plan con los mismos profesionales.</p></div><strong className="tabular-number">{account.professionals}</strong></div>
        <div className="monthly-breakdown"><span className="billing-overline">Desglose mensual</span><div><span>{professionalLabel(account.professionals)} {account.professionals === 1 ? "(base)" : ""}</span><strong className="tabular-number">{formatClp(account.monthlyPrice)}</strong></div><div className="monthly-total"><strong>Subtotal mensual</strong><strong className="tabular-number">{formatClp(account.monthlyPrice)}</strong></div></div>
        <div className="billing-info-box"><LineIcon name="info" /><div><p>Los asistentes de odontología son gratuitos e ilimitados. Solo pagas por profesionales (odontólogos y administradores).</p><p>¿Necesitas más profesionales? Usa la pestaña Agregar profesionales para sumarlos al tiempo restante de tu plan.</p></div></div>
      </section>
      <section className="settings-card billing-period-card">
        <header><h2>Período de facturación</h2><p className="muted">Elige cada cuánto pagar y obtén descuento.</p></header>
        <div className="period-options" role="radiogroup" aria-label="Período de facturación">{periods.map((period) => { const selected = selectedPeriod.id === period.id; return <button type="button" className={selected ? "period-option is-selected" : "period-option"} key={period.id} onClick={() => setSelectedPeriodId(period.id)} role="radio" aria-checked={selected}><span className="radio-dot" aria-hidden="true"><span /></span><span className="period-option-copy"><span className="period-option-title">{period.label}{period.badges?.map((badge) => <span className={badge === "Popular" ? "billing-badge popular-badge" : "billing-badge"} key={badge}>{badge}</span>)}</span><span className="muted">{period.description}</span></span><span className="period-price"><strong className="tabular-number">{formatClp(period.total)}</strong>{period.previousTotal && <span className="previous-price tabular-number">{formatClp(period.previousTotal)}</span>}{period.savings && <span className="period-savings">Ahorras {formatClp(period.savings)}</span>}</span></button>; })}</div>
        <div className="billing-total"><span>Total a pagar</span><strong className="tabular-number">{formatClp(selectedPeriod.total)}</strong></div>
        <p className="billing-payment-context">Al aprobar el pago, tu plan quedará vigente hasta el {formatDate(new Date(account.expiresAt.getFullYear(), account.expiresAt.getMonth() + selectedPeriod.months, account.expiresAt.getDate(), 12))}.</p>
        {renewSuccess && <p className="billing-success-banner" role="status">{renewSuccess}</p>}
        <button type="button" className="button button-primary billing-payment-button" disabled={isPaying} onClick={handleRenewPayment}><LineIcon name="wallet" />{isPaying ? "Procesando pago…" : "Pagar con MercadoPago"}</button>
        <TransferToggle amount={selectedPeriod.total} />
      </section>
    </div><section id="plan-add-panel" role="tabpanel" aria-labelledby="plan-add-tab" className="settings-card add-professionals-card" hidden={planView !== "add"}>
      <header><h2>Agregar profesionales</h2><p className="muted">Cobro proporcional hasta el vencimiento</p></header>
      <div className="billing-callout"><LineIcon name="info" /><p>Agrega profesionales a tu plan actual. Solo pagas el proporcional por los <strong>{account.daysRemaining} días</strong> restantes hasta tu vencimiento (<strong>{formatDate(account.expiresAt)}</strong>).</p></div>
      <div className="professional-stepper-row"><div><strong>Profesionales a agregar</strong><p className="muted">Actualmente tienes {professionalLabel(account.professionals)}</p></div><div className="stepper-wrap"><div className="stepper" role="group" aria-label="Profesionales a agregar"><button type="button" className="stepper-btn" aria-label="Disminuir" disabled={addCount === 1} onClick={() => setAddCount((value) => Math.max(1, value - 1))}>−</button><output className="stepper-value" aria-live="polite">{addCount}</output><button type="button" className="stepper-btn" aria-label="Aumentar" disabled={addCount === 10} onClick={() => setAddCount((value) => Math.min(10, value + 1))}>+</button></div><span className="muted">Se sumarán al tiempo restante de tu plan.</span></div></div>
      <div className="monthly-breakdown add-cost-breakdown"><div><span>Plan actual ({professionalLabel(account.professionals)})</span><strong className="tabular-number">{formatClp(account.monthlyPrice)}/mes</strong></div><div><span>Nuevo plan ({professionalLabel(futureProfessionals)})</span><strong className="tabular-number">{formatClp(account.monthlyPrice + addonMonthly)}/mes</strong></div><div><span>Aumento mensual</span><strong className="tabular-number">+{formatClp(addonMonthly)}/mes</strong></div><div><span>Proporcional por {remainingTime(account.daysRemaining)}</span><strong className="tabular-number">× {formatProrationFactor(account.daysRemaining)}</strong></div><div className="billing-total"><span>Total a pagar hoy</span><strong className="tabular-number">{formatClp(proportionalTotal)}</strong></div></div>
      <div className="billing-callout is-success"><LineIcon name="check" /><p>Tu plan pasará a <strong>{professionalLabel(futureProfessionals)}</strong> hasta el <strong>{formatDate(account.expiresAt)}</strong>.</p></div>
      {addSuccess && <p className="billing-success-banner" role="status">{addSuccess}</p>}
      <button type="button" className="button button-primary billing-payment-button" disabled={isPaying || proportionalTotal === 0} onClick={handleAddPayment}><LineIcon name="wallet" />{isPaying ? "Procesando pago…" : `Pagar ${formatClp(proportionalTotal)} con MercadoPago`}</button>
      <TransferToggle amount={proportionalTotal} />
    </section></>

    <details className="billing-history"><summary><span>Historial de pagos</span><small className="muted">Pagos realizados de tu suscripción.</small></summary><div className="billing-history-content">{payments.length === 0 ? <p className="billing-empty-state">Sin pagos todavía.</p> : payments.map((payment) => <div className="billing-history-row" key={payment.id}><span>{formatDate(payment.date)}</span><span>{payment.concept}</span><strong className="tabular-number">{formatClp(payment.amount)}</strong><span>{payment.method}</span><span className="badge-active"><span aria-hidden="true" />Pagado</span></div>)}</div></details>
  </div>;
}
