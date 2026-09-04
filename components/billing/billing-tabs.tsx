"use client";

export type BillingTab = "plan" | "ia" | "usage";

type BillingTabsProps = {
  activeTab: BillingTab;
  onChange: (tab: BillingTab) => void;
};

const tabs: Array<{ id: BillingTab; label: string; icon: "star" | "sparkles" | "activity" }> = [
  { id: "plan", label: "Plan", icon: "star" },
  { id: "ia", label: "IA", icon: "sparkles" },
  { id: "usage", label: "Uso", icon: "activity" },
];

function TabIcon({ name }: { name: (typeof tabs)[number]["icon"] }) {
  if (name === "star") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></svg>;
  if (name === "sparkles") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 .9 3.1L16 7l-3.1.9L12 11l-.9-3.1L8 7l3.1-.9L12 3ZM19 12l.6 2.4L22 15l-2.4.6L19 18l-.6-2.4L16 15l2.4-.6L19 12ZM6 13l1.1 3.9L11 18l-3.9 1.1L6 23l-1.1-3.9L1 18l3.9-1.1L6 13Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-7M20 16v-2" /></svg>;
}

export function BillingTabs({ activeTab, onChange }: BillingTabsProps) {
  return <div className="billing-tabs" role="tablist" aria-label="Secciones de plan">
    {tabs.map((tab) => (
      <button
        className={activeTab === tab.id ? "billing-tab is-active" : "billing-tab"}
        key={tab.id}
        onClick={() => onChange(tab.id)}
        role="tab"
        aria-selected={activeTab === tab.id}
        aria-controls={`billing-${tab.id}-panel`}
        id={`billing-${tab.id}-tab`}
        type="button"
      >
        <TabIcon name={tab.icon} />
        <span>{tab.label}</span>
      </button>
    ))}
  </div>;
}
