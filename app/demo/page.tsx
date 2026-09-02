import { FICTIONAL_DATA_MARKER, demoPatients } from "@/db/fixtures/demo";

export default function DemoPage() { return <main><h1>Demo NexoDent</h1><p>{FICTIONAL_DATA_MARKER}</p><p>Clínica Sonrisa Andes · Providencia y Ñuñoa · {demoPatients.length} pacientes ficticios.</p></main>; }
