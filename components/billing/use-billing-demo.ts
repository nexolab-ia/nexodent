"use client";

import { useMemo, useState } from "react";

export const BASE_MONTHLY_PRICE = 17_850;
export const PROFESSIONAL_ADDON_PRICE = 4_650;
export const CREDIT_PRICE = 3.5;
export const INCLUDED_MONTHLY_CREDITS = 200;

export type BillingPeriod = "monthly" | "semiannual" | "annual";

export type PeriodOption = {
  id: BillingPeriod;
  label: string;
  description: string;
  months: number;
  total: number;
  previousTotal?: number;
  savings?: number;
  badges?: string[];
};

export function getPeriodOptions(monthlyPrice: number): PeriodOption[] {
  return [
    { id: "monthly", label: "Mensual", description: "Paga mes a mes.", months: 1, total: monthlyPrice },
    { id: "semiannual", label: "Semestral", description: "Paga 5 meses, recibe 6.", months: 6, total: monthlyPrice * 5, previousTotal: monthlyPrice * 6, savings: monthlyPrice, badges: ["Popular", "Promoción"] },
    { id: "annual", label: "Anual", description: "Paga 10 meses, recibe 12.", months: 12, total: monthlyPrice * 10, previousTotal: monthlyPrice * 12, savings: monthlyPrice * 2, badges: ["Promoción"] },
  ];
}

export const PERIOD_OPTIONS = getPeriodOptions(BASE_MONTHLY_PRICE);

export type Payment = {
  id: string;
  date: Date;
  concept: string;
  amount: number;
  method: "MercadoPago";
};

export type CreditMovement = {
  id: string;
  date: Date;
  description: string;
  credits: number;
  method: "MercadoPago";
};

const INITIAL_EXPIRY_DATE = new Date(2026, 9, 9, 12);

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

// MOCK — reemplazar por API real cuando exista pasarela.
export function useBillingDemo() {
  const [expiresAt, setExpiresAt] = useState(INITIAL_EXPIRY_DATE);
  const [credits, setCredits] = useState(INCLUDED_MONTHLY_CREDITS);
  const [professionals, setProfessionals] = useState(1);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [movements, setMovements] = useState<CreditMovement[]>([]);

  const monthlyPrice = useMemo(
    () => BASE_MONTHLY_PRICE + (professionals - 1) * PROFESSIONAL_ADDON_PRICE,
    [professionals],
  );
  const periods = useMemo(() => getPeriodOptions(monthlyPrice), [monthlyPrice]);

  const account = useMemo(() => ({
    expiresAt,
    daysRemaining: 35,
    professionals,
    monthlyPrice,
    assistants: "Ilimitados",
    credits,
    creditsUsed: 0,
    dictations: 0,
    improvements: 0,
    storageUsedKb: 0,
    storageLimitGb: 1,
    documents: 0,
  }), [credits, expiresAt, monthlyPrice, professionals]);

  async function simulatePlanPayment(period: PeriodOption) {
    const nextExpiry = addMonths(expiresAt, period.months);
    await delay(800);
    const payment: Payment = {
      id: `plan-${Date.now()}`,
      date: new Date(),
      concept: `Renovación plan ${period.label.toLowerCase()}`,
      amount: period.total,
      method: "MercadoPago",
    };
    setExpiresAt(nextExpiry);
    setPayments((current) => [payment, ...current]);
    return { payment, expiresAt: nextExpiry };
  }

  async function simulateCreditRecharge(amount: number) {
    const receivedCredits = Math.floor(amount / CREDIT_PRICE);
    await delay(800);
    const movement: CreditMovement = {
      id: `credits-${Date.now()}`,
      date: new Date(),
      description: "Recarga de créditos",
      credits: receivedCredits,
      method: "MercadoPago",
    };
    setCredits((current) => current + receivedCredits);
    setMovements((current) => [movement, ...current]);
    return movement;
  }

  async function simulateAddProfessional(count: number) {
    const addonMonthly = PROFESSIONAL_ADDON_PRICE * count;
    const total = Math.round(addonMonthly * (account.daysRemaining / 30));
    await delay(800);
    const nextProfessionals = professionals + count;
    const payment: Payment = {
      id: `prof-${Date.now()}`,
      date: new Date(),
      concept: count === 1 ? "Agregar 1 profesional adicional" : `Agregar ${count} profesionales adicionales`,
      amount: total,
      method: "MercadoPago",
    };
    setProfessionals(nextProfessionals);
    setPayments((current) => [payment, ...current]);
    return { payment, professionals: nextProfessionals, total };
  }

  return { account, periods, payments, movements, simulatePlanPayment, simulateAddProfessional, simulateCreditRecharge };
}

export function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
}

export function formatDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}
