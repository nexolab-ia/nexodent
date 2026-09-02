"use server";
import { revalidatePath } from "next/cache";
import { sql } from "@/db/client";
import { confirmAppointment, markAppointmentAttendance } from "@/features/scheduling/actions";
import { requestTenantContext } from "@/lib/request-context";
import { runAsTenant } from "@/lib/tenancy";
function id(formData:FormData):string{const value=String(formData.get("appointmentId")??"");if(!value)throw new Error("La cita no es válida.");return value;}
export async function confirmDashboardAppointment(formData:FormData){const actor=await requestTenantContext();await runAsTenant(sql,actor,tx=>confirmAppointment(tx,actor,id(formData)));revalidatePath("/dashboard");}
export async function markDashboardAttendance(formData:FormData){const actor=await requestTenantContext();const attendance=String(formData.get("attendance"));if(attendance!=="attended"&&attendance!=="missed")throw new Error("La asistencia no es válida.");await runAsTenant(sql,actor,tx=>markAppointmentAttendance(tx,actor,id(formData),attendance));revalidatePath("/dashboard");}
