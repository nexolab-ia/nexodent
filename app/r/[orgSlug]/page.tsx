import { PublicBookingForm } from "@/features/public-booking/public-booking-form";

export const dynamic = "force-dynamic";
export default async function PublicBookingPage({ params, searchParams }: { params: Promise<{ orgSlug: string }>; searchParams: Promise<{ site?: string; token?: string }> }) { const { orgSlug } = await params; const { site, token } = await searchParams; return <main className="booking-page"><p className="booking-brand">NexoDent</p><h1>Reserva tu hora</h1><p>Agenda una atención en una clínica asociada. Solo solicitaremos los datos necesarios para tu reserva.</p><PublicBookingForm orgSlug={orgSlug} siteSlug={site} token={token ?? ""} /></main>; }
