"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function updateProfile(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 160) throw new Error("Ingresa un nombre de entre 2 y 160 caracteres.");
  await auth.api.updateUser({ headers: await headers(), body: { name } });
  redirect("/profile?updated=1");
}

export async function signOut(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
