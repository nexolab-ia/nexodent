"use client";

import { useState } from "react";
import { BillingTabs, type BillingTab } from "./billing-tabs";
import { PlanTab } from "./plan-tab";
import { IaTab } from "./ia-tab";
import { UsoTab } from "./uso-tab";
import { useBillingDemo } from "./use-billing-demo";

export function PlanPage({ organizationName }: { organizationName: string }) {
  const [activeTab, setActiveTab] = useState<BillingTab>("plan");
  const billing = useBillingDemo();

  return <main className="billing-page" aria-label={`Plan de ${organizationName}`}>
    <header className="billing-heading">
      <h1>Plan</h1>
      <p className="muted">Administra tu suscripción y métodos de pago.</p>
    </header>
    <BillingTabs activeTab={activeTab} onChange={setActiveTab} />
    {activeTab === "plan" && <section id="billing-plan-panel" role="tabpanel" aria-labelledby="billing-plan-tab"><PlanTab account={billing.account} payments={billing.payments} onPay={billing.simulatePlanPayment} /></section>}
    {activeTab === "ia" && <section id="billing-ia-panel" role="tabpanel" aria-labelledby="billing-ia-tab"><IaTab account={billing.account} movements={billing.movements} onRecharge={billing.simulateCreditRecharge} /></section>}
    {activeTab === "usage" && <section id="billing-usage-panel" role="tabpanel" aria-labelledby="billing-usage-tab"><UsoTab account={billing.account} /></section>}
  </main>;
}
