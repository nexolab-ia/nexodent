"use client";

import { useState } from "react";
import { CREDIT_PRICE, formatClp } from "./use-billing-demo";

type IaTabProps = {
  account: { credits: number; creditsUsed: number; dictations: number; improvements: number };
  movements: Array<{ id: string; date: Date; description: string; credits: number; method: "MercadoPago" }>;
  onRecharge: (amount: number) => Promise<{ credits: number }>;
};

const suggestedAmounts = [2_000, 5_000, 10_000];
const numberFormat = new Intl.NumberFormat("es-CL");

function IaIcon({ name }: { name: "zap" | "microphone" | "sparkles" | "box" }) {
  const paths = {
    zap: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />,
    microphone: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></>,
    sparkles: <path d="m12 3 .9 3.1L16 7l-3.1.9L12 11l-.9-3.1L8 7l3.1-.9L12 3ZM19 12l.6 2.4L22 15l-2.4.6L19 18l-.6-2.4L16 15l2.4-.6L19 12ZM6 13l1.1 3.9L11 18l-3.9 1.1L6 23l-1.1-3.9L1 18l3.9-1.1L6 13Z" />,
    box: <><path d="m12 3 7 4-7 4-7-4 7-4ZM5 12l7 4 7-4M5 17l7 4 7-4" /><path d="M5 7v10M19 7v10" /></>,
  };
  return <svg className="billing-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export function IaTab({ account, movements, onRecharge }: IaTabProps) {
  const [amount, setAmount] = useState(5_000);
  const [isPaying, setIsPaying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const receivedCredits = Math.floor(Math.max(0, amount) / CREDIT_PRICE);

  async function handleRecharge() {
    if (receivedCredits === 0) return;
    setIsPaying(true);
    setSuccessMessage(null);
    const movement = await onRecharge(amount);
    setSuccessMessage(`Recarga exitosa — sumaste ${numberFormat.format(movement.credits)} créditos a tu saldo.`);
    setIsPaying(false);
  }

  return <div className="billing-stack">
    {successMessage && <p className="billing-success-banner" role="status">{successMessage}</p>}
    <div className="billing-grid ia-grid">
      <section className="settings-card ia-balance-card">
        <header><h2><IaIcon name="zap" />Tu saldo</h2><p className="muted">Disponible · consumo de Septiembre 2026</p></header>
        <div className="ia-balance-list">
          <div className="ia-balance-primary"><span>Créditos disponibles</span><strong className="stat-number">{numberFormat.format(account.credits)}</strong></div>
          <div><span>Consumido este mes</span><strong className="tabular-number">{account.creditsUsed}</strong></div>
          <div><span><IaIcon name="microphone" />Dictados</span><strong className="tabular-number">{account.dictations}</strong></div>
          <div><span><IaIcon name="sparkles" />Mejoras</span><strong className="tabular-number">{account.improvements}</strong></div>
        </div>
      </section>

      <section className="settings-card credit-recharge-card">
        <header><h2><IaIcon name="box" />Recargar créditos</h2><p className="muted">Mientras más pagas, mejor el precio por crédito.</p></header>
        <label className="credit-amount-label" htmlFor="credit-amount">Monto a pagar (CLP)
          <span className="credit-amount-input"><span>$</span><input id="credit-amount" type="number" min="0" step="1" value={amount || ""} onChange={(event) => setAmount(Math.max(0, Number(event.target.value)))} aria-describedby="credit-amount-help" /></span>
        </label>
        <div className="suggested-amounts" aria-label="Montos sugeridos"><span id="credit-amount-help">Sugeridos:</span>{suggestedAmounts.map((suggestion) => <button type="button" key={suggestion} className={amount === suggestion ? "is-selected" : ""} onClick={() => setAmount(suggestion)}>{formatClp(suggestion)}</button>)}</div>
        <div className="credits-received"><span className="billing-overline">Recibes</span><strong className="stat-number">{numberFormat.format(receivedCredits)} <small>créditos</small></strong><span>Tarifa $3,5 / crédito</span></div>
        <button type="button" className="button button-primary billing-payment-button" disabled={isPaying || receivedCredits === 0} onClick={handleRecharge}>{isPaying ? "Procesando pago…" : `Pagar ${formatClp(amount)} CLP · ${numberFormat.format(receivedCredits)} créditos`}</button>
        <p className="billing-payment-note">Pago seguro vía MercadoPago. Tu saldo se actualiza al confirmar el pago.</p>
      </section>
    </div>
    <details className="billing-history" open>
      <summary><span>Historial de movimientos</span><small className="muted">Últimas recargas y consumos.</small></summary>
      <div className="billing-history-content">
        {movements.length === 0 ? <p className="billing-empty-state">Sin movimientos todavía.</p> : movements.map((movement) => <div className="billing-history-row credit-history-row" key={movement.id}><span>{new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(movement.date)}</span><span>{movement.description}</span><strong className="credit-positive tabular-number">+{numberFormat.format(movement.credits)} créditos</strong><span>{movement.method}</span></div>)}
      </div>
    </details>
  </div>;
}
