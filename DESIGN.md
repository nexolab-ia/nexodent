# DESIGN.md — Identidad visual NexoDent

Diseño moderno, limpio, tipo fintech/SaaS premium. EXPLÍCITAMENTE distinto a CIMAOS (look clínico tradicional) y Dentalink (legacy). No debe "verse como ya" — nada de verdes clínicos, azules médicos genéricos ni plantillas de software médico.

> ⚠️ Complemento normativo: **`UX-PRINCIPIOS.md`** (mobile-first, presupuesto de clics, ledger claro, estados texto+color, checklist de verificación). Todo brief de UI DEBE cumplir ambos documentos y citar la "Verificación UX" de UX-PRINCIPIOS.md. Research que los sustenta: `docs/research-ux/` (2026-09-03).

## Modo de diseño (Impeccable)

- **Mode**: Operate (dashboard SaaS) + Persuade en landing pública
- **Vibe**: "Fintech de salud" — oscuro elegante + acento vibrante, aire premium y confiable

## Paleta (CSS custom properties)

```css
:root {
  --bg: #0B1120;            /* azul-noche profundo (fondos oscuros) */
  --surface: #111A2E;       /* tarjetas / paneles */
  --surface-2: #1A2740;     /* elevado */
  --ink: #F1F5F9;           /* texto principal sobre oscuro */
  --muted: #94A3B8;         /* texto secundario */
  --accent: #22D3EE;        /* cian eléctrico (firma NexoDent) */
  --accent-strong: #06B6D4;
  --success: #34D399;
  --warning: #FBBF24;
  --danger: #F87171;
  --border: #243249;
  --radius: 14px;
  --shadow: 0 8px 30px rgba(2,6,23,.5);
}
```

- **Landing pública**: puede usar fondo claro (#F8FAFC) con las mismas tarjetas oscuras para contraste premium; la APP (dashboard) va 100% dark.
- **Acento único**: cian eléctrico para acciones/CTA/estado activo. Verde solo para éxito/pago. Nada más.
- Contraste AA: ink sobre bg (15:1), cian sobre bg (7:1), texto sobre accent → usar `--bg` sobre cian.

## Tipografía

- **Display (títulos/H1/hero/landing)**: sans geométrica premium — **"Space Grotesk"** (Google Fonts, 500/700) — se ve moderna, NO es Inter ni Roboto.
- **UI (body/botones/dashboard)**: sans legible — **"Inter"** (400/500/600) para el sistema (el detector lo marcará como overused-font — falso positivo aceptado: en dashboard la legibilidad manda; el display Space Grotesk da la personalidad).
- **Mono (datos clínicos/códigos/odontograma)**: "JetBrains Mono" solo para IDs, códigos de prestación y tablas densas.
- Escala: hero 44-56px, H2 28px, H3 20px, body 15px, caption 12.5px, mono 13px.
- Letter-spacing: títulos 0.3-0.5px; botones 0.4px; labels uppercase 0.6px en el sistema.

## Layout y componentes

### Landing pública (/)
- **Nav**: logo "NexoDent" con marca cian (icono de diente estilizado geométrico — SVG, no emoji), links (Funcionalidades, Precios, Blog), CTA "Probar gratis". Fondo oscuro translúcido blur, sticky.
- **Hero**: fondo azul-noche con **grid pattern sutil** + glow radial cian; headline Space Grotesk "El sistema que ordena y hace crecer tu clínica"; subtexto; CTA cian "Empezar 7 días gratis" + secundario "Ver demo". Mockup del dashboard enmarcado (tarjeta oscura con esquinas de agenda/odontograma) a la derecha.
- **Barra de confianza**: "Sin tarjeta · Cancela cuando quieras · +500 clínicas · 5.0 en tiendas".
- **Sección problema/solución**: "El problema real" (texto) vs "NexoDent lo ordena" (visual) — copy tipo CIMAOS pero sin copiar su texto.
- **Módulos**: grilla 6 tarjetas oscuras (Agenda, Ficha, Presupuestos, Cobros, Reportes IA, Recordatorios) con ícono SVG de línea fina y hover con glow cian.
- **IA proactiva (diferenciador)**: sección destacada mostrando 3 "avisos" estilo notificación: tarjeta oscura con borde cian "Los martes 15:00-18:00 quedan vacíos → Sugerencia: ofrece ese horario..." — mostrar la IA funcionando, no describirla.
- **Precios**: tabla transparente por profesional con toggle mensual/semestral/anual, destacar el plan Core.
- **Testimonios + CTA final + Footer** oscuro con columnas.

### Dashboard (app, tras login — dark)
- **Sidebar** compacto: Agenda, Pacientes, Presupuestos, Cobros, Reportes, Configuración. Íconos SVG de línea, active = cian con barra lateral. En <768px el sidebar se REEMPLAZA por bottom tab bar (Hoy · Agenda · Pacientes · Cobros · Perfil) — ver UX-PRINCIPIOS.md P1.
- **Topbar**: buscador global, avisos IA (campana con badge), perfil.
- **Agenda**: vista semana/día, grid por profesional/box, citas como chips de color por estado (confirmada/pendiente/cancelada), drag & drop, click para nueva cita. Panel derecho con detalle de la cita. En tablet vertical: hit-areas amplios, detalle en bottom-sheet. Estados SIEMPRE chip texto+color (no solo color).
- **Ficha paciente**: header con datos + estado de cuenta, tabs (Evoluciones, Odontograma, Documentos, Cobros). Odontograma SVG interactivo por pieza.
- **Presupuestos**: lista + editor con búsqueda de prestaciones, total, estado; botón "compartir link público".
- **Cobros**: tabla de abonos por paciente, saldo, botón registrar pago, cuenta corriente. Estilo "accounting real": separar visualmente pago paciente vs aseguradora; saldo trazable a la línea (UX-PRINCIPIOS.md P3).
- **Reportes IA**: KPIs (recaudación, deuda, producción por profesional) con gráficos simples (SVG/barras) + feed de "Avisos de tu clínica" con sugerencias y botones "Aplicar" / "Ver detalle".
- **Modo claro**: opcional en settings; por defecto dark. Ambos con contraste AA desde el día 1.

## Anti-patrones (prohibido)

- ❌ Nada de verde clínico / azul médico genérico / blanco hospitalario en la app
- ❌ Sin gradientes chillones (solo glow cian sutil en hero)
- ❌ Sin emojis, sin clip-art, sin imágenes stock obvias (íconos SVG propios)
- ❌ Sin Inter como display (solo body); display = Space Grotesk
- ❌ Sin tablas de datos sin mono para códigos/IDs
- ❌ Sin más de 2-3 fuentes (Space Grotesk + Inter + JetBrains Mono opcional)
- ❌ Sin formularios sin estados de error inline y focus visible
- ❌ No copiar el copy de CIMAOS textualmente (parafrasear el concepto, no las frases)
- ❌ Sin estados de cita solo con color (siempre chip texto+color) — ver UX-PRINCIPIOS.md P4
- ❌ Sin flujos de >2 clics en tareas diarias (agenda, pago, asistencia) — ver UX-PRINCIPIOS.md P2
- ❌ Sin navegación móvil colapsada: <768px = bottom tab bar, funcionalidad completa (no "solo lectura") — ver UX-PRINCIPIOS.md P1
- ❌ Sin etiquetas financieras inventadas ni líneas de ledger confusas — ver UX-PRINCIPIOS.md P3

## Microcopy de conversión

- CTA primario: "Empezar 7 días gratis", "Probar NexoDent", "Ver demo"
- Trust: "Sin tarjeta · Cancela cuando quieras", "Migración asistida desde CIMAOS/Dentalink", "Soporte por WhatsApp real"
- IA: "Avisos de tu clínica", "Sugerencia", "Aplicar" / "Ver detalle"
- Onboarding: "Semana 1: Ordena · Mes 1: Mide · Después: Crece"

## Logo

- Wordmark "NexoDent" en Space Grotesk bold, con el icono de diente geométrico SVG en cian (hexágono/diente estilizado minimalista). Punto cian sobre la "o" o como acento del icono.
