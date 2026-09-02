import type { Sql, TransactionSql } from "postgres";
import { authorize } from "@/features/tenant-identity/authorize";
import type { TenantContext } from "@/lib/tenancy";
import { svgProjection, validateToothChange, type OdontogramState, type Surface, type ToothEvent } from "./model";

/** Serializes a patient's event stream so each immutable version and SVG snapshot agrees. */
export async function appendOdontogramEvent(sql: Sql | TransactionSql, actor: TenantContext, patientId: string, input: { tooth: number; surface: Surface; state: OdontogramState; reason: string; siteId?: string }): Promise<void> {
  authorize({ ...actor, resourceSiteId: input.siteId }, "odontogram:manage");
  validateToothChange(input.tooth, input.surface, input.state, input.reason);
  { const transaction = sql;
    await transaction`SELECT pg_advisory_xact_lock(hashtext(${patientId}))`;
    const prior = await transaction<{ tooth: number; surface: Surface; stateAfter: OdontogramState; occurredAt: Date; version: number }[]>`SELECT tooth, surface, state_after AS "stateAfter", occurred_at AS "occurredAt", version FROM odontogram_events WHERE organization_id = ${actor.organizationId} AND patient_id = ${patientId} ORDER BY version`;
    const priorState = [...prior].reverse().find((event) => event.tooth === input.tooth && event.surface === input.surface)?.stateAfter ?? null;
    const version = (prior.at(-1)?.version ?? 0) + 1;
    const event: ToothEvent = { tooth: input.tooth, surface: input.surface, stateAfter: input.state, occurredAt: new Date(), version };
    const projection = svgProjection([...prior, event]);
    await transaction`INSERT INTO odontogram_events (organization_id, patient_id, site_id, actor_membership_id, tooth, surface, state_before, state_after, reason, version, svg_snapshot) VALUES (${actor.organizationId}, ${patientId}, ${input.siteId ?? null}, ${actor.membershipId}, ${input.tooth}, ${input.surface}, ${priorState}, ${input.state}, ${input.reason.trim()}, ${version}, ${JSON.stringify(projection)}::jsonb)`;
    await transaction`INSERT INTO audit_logs (organization_id, site_id, actor_membership_id, action, entity, entity_id, reason) VALUES (${actor.organizationId}, ${input.siteId ?? null}, ${actor.membershipId}, 'odontogram.event_created', 'patient', ${patientId}, ${input.reason.trim()})`;
  }
}
