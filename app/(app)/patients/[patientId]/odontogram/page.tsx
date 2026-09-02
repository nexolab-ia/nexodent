import Link from "next/link";
import { OdontogramControl } from "@/components/odontogram/odontogram-control";
import { recordOdontogramChange } from "../actions";
export default async function PatientOdontogramPage({ params }: { params: Promise<{ patientId: string }> }) { const { patientId } = await params; return <main><Link href={`/patients/${patientId}`}>Volver a ficha clínica</Link><OdontogramControl recordAction={recordOdontogramChange.bind(null, patientId)} /><section><h2>Historial</h2><p className="empty-state">No hay cambios registrados. Cada cambio aceptado se conserva como una nueva versión.</p></section></main>; }
