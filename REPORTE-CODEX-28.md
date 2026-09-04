# CODEX-28 delivery report — Plan settings demo

Implemented `/settings/plan` as a tenant-validated, client-side billing demo. It has Plan, IA, and Uso tabs with no database schema, migration, payment dependency, commit, push, or deployment.

## Quick path

1. Sign in to a tenant and open `/settings/plan`.
2. Select a billing period or a suggested credit amount.
3. Simulate a MercadoPago payment to see the local balance, expiry date, and history update.
4. Refresh the browser to restore the documented demo state.

## Delivered scope

| Area | Result |
|---|---|
| Server route | Added static `/settings/plan`, which validates the current tenant and reads only its organization name before rendering the client UI. |
| Plan tab | Current-plan metrics, active status, billing-period selection, transfer notice, simulated payment state, and payment history. |
| IA tab | Credit balance, free-amount input, suggested amounts, `floor(amount / 3.5)` calculation, simulated recharge, and movement history. |
| Uso tab | Document storage status, dynamic Monday-to-Sunday zero-usage chart, and monthly empty states. |
| Mock boundary | `useBillingDemo` keeps all state in `useState`; it intentionally resets on reload and contains the required API-replacement marker. |
| Styling | Added the scoped `/* Billing */` CSS block using existing dark-mode design tokens, responsive tab scrolling, a one-column layout below 880px, visible focus states, and reduced-motion handling. |

## Changed files

- `app/(app)/settings/plan/page.tsx` — static settings route with tenant validation.
- `components/billing/plan-page.tsx` — client shell and active-tab state.
- `components/billing/billing-tabs.tsx` — accessible horizontal Plan/IA/Uso tabs with authored SVG icons.
- `components/billing/plan-tab.tsx` — subscription renewal and payment-history interface.
- `components/billing/ia-tab.tsx` — IA credit recharge interface.
- `components/billing/uso-tab.tsx` — storage and usage interface.
- `components/billing/use-billing-demo.ts` — demo account state, prices, calculations, and simulated payment actions.
- `app/globals.css` — Billing styles.

## Verification evidence

| Check | Result | Evidence |
|---|---|---|
| Lint | PASS | `timeout 300 npm run lint` completed with exit code 0. |
| Production build | PASS | `timeout 420 npm run build` completed with exit code 0. `.next/server/app-paths-manifest.json` contains `/settings/plan`; the static route did not collide with `[seccion]`. |
| Unit tests | Known pre-existing failure | `timeout 300 npm run test:unit` ran 48 tests: 47 passed, 1 failed. `tests/unit/foundation.test.ts` cannot read the absent `docker-compose.yml`; this change does not touch that configuration. |
| Integration tests | PASS | `timeout 420 npm run test:integration -- --reporter=verbose`: 9 files and 20 tests passed. |
| Static UI checks | PASS | No visible voseo patterns or emoji found in new billing source; all three tabs exist; credit amounts use 2,000 / 5,000 / 10,000 and `Math.floor`; prices derive from the 17,850 CLP base price with 5- and 10-month totals. |
| Runtime route boundary | PASS with auth boundary | A production-server `GET /settings/plan` returned the expected `307` redirect to `/login` without an authenticated session. Full visual interaction requires tenant sign-in. |

## UX verification

- Billing tabs and primary actions have at least 44px touch targets; no core action relies on hover.
- The payment and recharge flows are two actions: select amount or period, then pay.
- Payment/status indicators combine text and color, and monetary figures use tabular numerals.
- Tabs scroll on narrow screens; the main grid becomes one column below 880px; the weekly chart compresses without horizontal overflow.
- `prefers-reduced-motion` disables smooth motion in the billing surface.
- Code-level coverage was completed. Authenticated desktop, 320px, 375px, and 768px visual inspection remains a post-deploy/manual QA step because this environment has no logged-in tenant session.

## Deviations and remaining gateway work

No scope deviations were made. The only failing verification is the repository's pre-existing missing `docker-compose.yml` unit-test fixture.

Before connecting a real payment gateway, replace the mock hook with these integrations:

1. Persist subscription, billing period, entitlement, payment, and credit-movement records in a tenant-scoped backend model.
2. Create MercadoPago preference/payment intents and redirect or embed its checkout.
3. Validate webhook signatures server-side, make payment processing idempotent, and update entitlement/credit balances atomically.
4. Add transfer payment instructions, reconciliation, and an approved/manual-payment state.
5. Replace fixed expiry/usage values with tenant billing and storage data, including authorization and audit trails.
6. Add focused component and payment-webhook tests for real gateway states: pending, approved, rejected, retried, duplicated, and refunded.

## Delivery boundary

No commit, push, deployment, database migration, dependency installation, or edit outside the requested Plan route/components/CSS/report was performed.
