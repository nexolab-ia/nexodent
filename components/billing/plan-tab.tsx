"use client";

import { useRef, useState } from "react";
import {
  formatClp,
  formatDate,
  PERIOD_OPTIONS,
  type PeriodOption,
} from "./use-billing-demo";

type PlanTabProps = {
  account: { expiresAt: Date; daysRemaining: number; professionals: number; assistants: string };
  payments: Array<{ id: string; date: Date; concept: string; amount: number; method: "MercadoPago" }>;
  onPay: (period: PeriodOption) => Promise<{ expiresAt: Date }>;
};

function LineIcon({ name }: { name: "refresh" | "user-plus" | "info" | "wallet" | "chevron" }) {
  const paths = {
    refresh: <><path d="M20 11a8 8 0 1 0 2 5.3" /><path d="M20 4v7h-7" /></>,
    "user-plus": <><circle cx="9" cy="7" r="4" /><path d="M3 21a6 6 0 0 1 12 0M19 8v6M16 11h6" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    wallet: <><path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13" /><path d="M16 13h5M16 13a1 1 0 1 0 0 .01" /></>,
    chevron: <path d="m8 10 4 4 4-4" />,
  };
  return <svg className="billing-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export function PlanTab({ account, payments, onPay }: PlanTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[0]);
  const [isPaying, setIsPaying] = useState(false);
  const [showTransferInfo, setShowTransferInfo] = useState(false);
  const [showProfessionalNotice, setShowProfessionalNotice] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const periodSection = useRef<HTMLElement>(null);

  async function handlePayment() {
    setIsPaying(true);
    setSuccessMessage(null);
    const result = await onPay(selectedPeriod);
    setSuccessMessage(`Pago exitoso — tu plan quedó renovado hasta el ${formatDate(result.expiresAt)}.`);
    setIsPaying(false);
  }

  function handleRenew() {
    setSelectedPeriod(PERIOD_OPTIONS[0]);
    periodSection.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return <div className="billing-stack">
    {successMessage && <p className="billing-success-banner" role="status">{successMessage}</p>}
    <section className="settings-card plan-overview-card">
      <header className="plan-overview-heading">
        <div>
          <h2>Mi plan actual</h2>
          <p className="muted">Vence el {formatDate(account.expiresAt)}</p>
        </div>
        <span className="badge-active"><span aria-hidden="true" />Activo</span>
      </header>
      <div className="plan-stats-grid">
        <div className="plan-stat">
          <span className="plan-stat-label">Profesionales</span>
          <strong className="stat-number">{account.professionals}</strong>
          <span className="muted">{account.professionals} en uso</span>
          <span className="professional-progress" aria-label={`${account.professionals} de ${account.professionals} profesionales en uso`}><span /></span>
        </div>
        <div className="plan-stat">
          <span className="plan-stat-label">Días restantes</span>
          <strong className="stat-number">{account.daysRemaining}</strong>
        </div>
        <div className="plan-stat">
          <span className="plan-stat-label">Asistentes</span>
          <strong className="stat-number stat-text">{account.assistants}</strong>
        </div>
      </div>
      <div className="plan-inline-actions">
        <button type="button" className="billing-text-button" onClick={handleRenew}><LineIcon name="refresh" />Renovar plan</button>
        <button type="button" className="billing-text-button" onClick={() => setShowProfessionalNotice(true)}><LineIcon name="user-plus" />Agregar profesionales</button>
      </div>
      {showProfessionalNotice && <p className="billing-inline-notice" role="status">Agregar profesionales estará disponible pronto.</p>}
    </section>

    <div className="billing-grid">
      <section className="settings-card plan-detail-card">
        <header><h2>Detalle de tu plan</h2><p className="muted">Composición del precio mensual.</p></header>
        <div className="plan-professionals-row"><div><strong>Profesionales</strong><p className="muted">Renueva tu plan con los mismos profesionales.</p></div><strong className="tabular-number">1</strong></div>
        <div className="monthly-breakdown">
          <span className="billing-overline">Desglose mensual</span>
          <div><span>1 profesional (base)</span><strong className="tabular-number">{formatClp(17_850)}</strong></div>
          <div className="monthly-total"><strong>Subtotal mensual</strong><strong className="tabular-number">{formatClp(17_850)}</strong></div>
        </div>
        <div className="billing-info-box"><LineIcon name="info" /><div><p>Los asistentes de odontología son gratuitos e ilimitados. Solo pagas por profesionales (odontólogos y administradores).</p><p>¿Necesitas más profesionales? Usa la pestaña Agregar profesionales para sumar profesionales al tiempo restante de tu plan.</p></div></div>
      </section>

      <section className="settings-card billing-period-card" ref={periodSection}>
        <header><h2>Período de facturación</h2><p className="muted">Elige cada cuánto pagar y obtén descuento.</p></header>
        <div className="period-options" role="radiogroup" aria-label="Período de facturación">
          {PERIOD_OPTIONS.map((period) => {
            const isSelected = selectedPeriod.id === period.id;
            return <button type="button" className={isSelected ? "period-option is-selected" : "period-option"} key={period.id} onClick={() => setSelectedPeriod(period)} role="radio" aria-checked={isSelected}>
              <span className="radio-dot" aria-hidden="true"><span /></span>
              <span className="period-option-copy"><span className="period-option-title">{period.label}{period.badges?.map((badge) => <span className={badge === "Popular" ? "billing-badge popular-badge" : "billing-badge"} key={badge}>{badge}</span>)}</span><span className="muted">{period.description}</span></span>
              <span className="period-price"><strong className="tabular-number">{formatClp(period.total)}</strong>{period.previousTotal && <span className="previous-price tabular-number">{formatClp(period.previousTotal)}</span>}{period.savings && <span className="period-savings">Ahorras {formatClp(period.savings)}</span>}</span>
            </button>;
          })}
        </div>
        <div className="billing-total"><span>Total a pagar</span><strong className="tabular-number">{formatClp(selectedPeriod.total)}</strong></div>
        <p className="billing-payment-context">Al aprobar el pago, tu plan quedará vigente hasta el {formatDate(new Date(account.expiresAt.getFullYear(), account.expiresAt.getMonth() + selectedPeriod.months, account.expiresAt.getDate(), 12))}.</p>
        <button type="button" className="button button-primary billing-payment-button" disabled={isPaying} onClick={handlePayment}><LineIcon name="wallet" />{isPaying ? "Procesando pago…" : "Pagar con MercadoPago"}</button>
        <button type="button" className="billing-transfer-button" aria-expanded={showTransferInfo} onClick={() => setShowTransferInfo((current) => !current)}>Pagar por transferencia<LineIcon name="chevron" /></button>
        {showTransferInfo && <p className="billing-inline-notice" role="status">Pronto podrás pagar por transferencia. Mientras tanto, usa MercadoPago.</p>}
      </section>
    </div>

    <details className="billing-history">
      <summary><span>Historial de pagos</span><small className="muted">Pagos realizados de tu suscripción.</small></summary>
      <div className="billing-history-content">
        {payments.length === 0 ? <p className="billing-empty-state">Sin pagos todavía.</p> : payments.map((payment) => <div className="billing-history-row" key={payment.id}><span>{formatDate(payment.date)}</span><span>{payment.concept}</span><strong className="tabular-number">{formatClp(payment.amount)}</strong><span>{payment.method}</span><span className="badge-active"><span aria-hidden="true" />Pagado</span></div>)}
      </div>
    </details>
  </div>;
}
