"use server";

import { headers } from "next/headers";
import { sql } from "@/db/client";
import { auth } from "@/lib/auth";

type OnboardingType = "independent" | "clinic";
type FieldName = "name" | "country" | "city" | "address" | "primaryPhone" | "secondaryPhone" | "email" | "accepted" | "form";
type OnboardingErrors = Partial<Record<FieldName, string>>;

export type OnboardingResult =
  | { ok: true; organizationId: string; redirectTo: "/dashboard" }
  | { ok: false; errors: OnboardingErrors };

const phonePattern = /^[\d +-]{6,20}$/;
const emailPattern = /^\S+@\S+\.\S+$/;

export async function createOnboarding(formData: FormData): Promise<OnboardingResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("No fue posible validar tu sesión.");

  const type = String(formData.get("type") ?? "") as OnboardingType;
  const name = String(formData.get("name") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const primaryPhone = String(formData.get("primaryPhone") ?? "").trim();
  const secondaryPhone = String(formData.get("secondaryPhone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const accepted = formData.get("accepted") === "on";
  const errors: OnboardingErrors = {};

  if (type !== "independent" && type !== "clinic") errors.form = "El tipo de espacio no es válido.";
  if (!name) errors.name = type === "clinic" ? "Ingresa el nombre de la clínica." : "Ingresa el nombre de la consulta.";
  else if (name.length > 160) errors.name = "El nombre puede tener hasta 160 caracteres.";
  if (!country) errors.country = "Ingresa el país.";
  if (!city) errors.city = "Ingresa la ciudad.";
  if (!address) errors.address = "Ingresa la dirección.";
  if (!primaryPhone) errors.primaryPhone = "Ingresa el teléfono principal.";
  else if (!phonePattern.test(primaryPhone)) errors.primaryPhone = "Usa entre 6 y 20 dígitos, espacios, + o -.";
  if (secondaryPhone && !phonePattern.test(secondaryPhone)) errors.secondaryPhone = "Usa entre 6 y 20 dígitos, espacios, + o -.";
  if (!email) errors.email = "Ingresa el email de contacto.";
  else if (!emailPattern.test(email) || email.length > 320) errors.email = "Ingresa un email válido.";
  if (!accepted) errors.accepted = "Debes aceptar las políticas y los términos para continuar.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  try {
    const rows = await sql<{ organizationId: string; siteId: string; membershipId: string }[]>`
      SELECT
        organization_id AS "organizationId",
        site_id AS "siteId",
        membership_id AS "membershipId"
      FROM app_create_onboarding(
        ${session.user.id}::uuid,
        ${type}::organization_type,
        ${name},
        ${country},
        ${city},
        ${address},
        ${primaryPhone},
        ${secondaryPhone || null},
        ${email}
      )
    `;
    const created = rows[0];
    if (!created) return { ok: false, errors: { form: "No pudimos crear tu espacio. Inténtalo nuevamente." } };
    return { ok: true, organizationId: created.organizationId, redirectTo: "/dashboard" };
  } catch (error) {
    if (error instanceof Error && error.message.includes("already onboarded")) {
      return { ok: false, errors: { form: "Tu cuenta ya tiene un espacio activo. Vuelve a ingresar para continuar." } };
    }
    return { ok: false, errors: { form: "No pudimos crear tu espacio. Inténtalo nuevamente." } };
  }
}
