# Tesis y estudios — SaaS / software de gestión dental (foco UX y front-end)

> Research 2026-09-03 — Brave Search vía Obscura+DataImpulse + fetches directos a fuentes abiertas (PMC, Dovepress, Medigraphic).
> Objetivo: evidencia académica y de proyectos para el diseño front-end de NexoDent (Next.js 16, uso en clínica, móvil/tablet).

## 1. Trabajos encontrados (16)

### Estudios de usabilidad (los más accionables)
1. **Comparative Usability Evaluation of Three Digital Smile Design Software Tools Using the SUS** — PMC12468294 (2025, rev. Dentistry Journal). URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC12468294/
   - 23 prostodoncistas evaluaron 3 softwares con System Usability Scale (SUS). Resultado: SmileCloud SUS 80.33 (grado A−, "good to very good"); PreTeeth AI Pro 74.24; Medit Link 73.15. Benchmark de usabilidad aceptable = **68**.
   - Lección: un SUS ≥ 68 es el estándar mínimo percibido; los líderes pasan de 80. La "curva" SUS es la métrica a usar en tests propios de NexoDent.
2. **Usability Assessment of Salud Electronic Dental Record System** — College of Dentistry, Saud bin Abdulaziz University (CCIDE.S481003, Dovepress 2024-25). URL: https://www.dovepress.com/usability-assessment-of-salud-electronic-dental-record-system-peer-reviewed-fulltext-article-CCIDE (también PMC11830931, T&F)
   - SUS medio **31.1 = "not acceptable"**. Usuarios novatos requirieron significativamente más clics que el usuario experto (problemas de navegación); solo 1 de 5 tareas se completó con la misma ruta que el experto.
   - Quejas textuales: "se ve viejo, parece Windows XP"; iconos poco claros; interfaz compleja; baja utilidad percibida (TAM: alta complejidad, baja compatibilidad).
   - Lección (qué NO hacer): UI moderna + iconografía autodescriptiva + flujos de 1-2 clics + curvas de aprendizaje cortas son requisitos, no lujo.
3. **Applying HCI Principles in Designing Usable Systems for Dentistry** — BasicMedicalKey / ResearchGate 385801732 (Thyvalikakath et al.). URL: https://basicmedicalkey.com/applying-hci-principles-in-designing-usable-systems-for-dentistry/
   - Analiza: uso de la terminología odontológica (DDS), la interfaz de Treatment Planning existente y combinación de heurísticas con user testing.
   - Lección: el vocabulario del dominio (nombres de procedimientos, odontograma) debe mapearse 1:1 en la UI; no inventar términos propios.
4. **A usability evaluation of four commercial dental computer-based patient records (CBR)** — JADA (ScienceDirect S0002817714607443, Thyvalikakath/Starren). URL: https://www.sciencedirect.com/science/article/abs/pii/S0002817714607443
   - Comparó métodos para detectar problemas de usabilidad en EHR dental: user testing, entrevistas semi-estructuradas y encuestas. Referencia clásica para armar un programa de evaluación propia.
5. **Usability assessment of an electronic health record in a comprehensive dental clinic** — SpringerOpen (2193-1801-2-220). URL: https://link.springer.com/article/10.1186/2193-1801-2-220
   - GUI diseñada considerando carga cognitiva (concepto "cognitive load"); documento de desarrollo + evaluación de usabilidad de EHR en clínica dental integral.

### Tesis / proyectos de ingeniería (LATAM)
6. **Software para la gestión de control de historias clínicas odontológicas** — Duque Persad KP, Univ. Rafael Urdaneta (Venezuela), vía Medigraphic. URL: https://www.medigraphic.com/cgi-bin/new/resumen.cgi?IDARTICULO=69826
7. **Sistema de Gestión de Historias Clínicas Odontológicas y Periodontales** (UCACUE, Ecuador, Red de Observatorios) — ResearchGate 374252587. URL: https://www.researchgate.net/publication/374252587
8. **Uso de software de gestión odontológica para mejorar la eficiencia administrativa de clínicas de Cuenca (Ecuador)** — RSD Journal 49173. URL: https://rsdjournal.org/rsd/article/download/49173/38522/503160
   - Encuestas a usuarios (docentes/profesionales): percepción de beneficios/desafíos del software odontológico en la gestión administrativa.
9. **Sistema web para consultorio dental (eficiencia de procesos)** — Universidad Politécnica Salesiana, Guayaquil (UPS-GT005353). URL: https://dspace.ups.edu.ec/bitstream/123456789/27862/1/UPS-GT005353.pdf
10. **Sistema de mejora en la gestión de citas para clínica dental (Scrum)** — Revista Código Científico (ITS Los Andes, Ecuador). URL: https://revistacodigocientifico.itslosandes.net/index.php/1/article/download/317/682/904
    - La mayoría de los pacientes prefiere una aplicación web para gestión de citas; usaron Scrum para mejorar experiencia de usuario.
11. **Aplicación web para gestión de clínica dental** — Repositorio EPN (Escuela Politécnica Nacional, Ecuador). URL: https://bibdigital.epn.edu.ec/handle/15000/22872
12. **Sistema Informatizado para la Gestión de la Clínica Estomatológica (Estomatología General Integral)** — Cuba, vía Medigraphic (resumen IDARTICULO=69826). URL: https://www.medigraphic.com/cgi-bin/new/resumen.cgi?IDARTICULO=69826
13. **Medical Records Orthodont-Soft** — SciELO Cuba (Rev. Ciencias Médicas, 2016). URL: http://scielo.sld.cu/scielo.php?script=sci_arttext&pid=S1561-31942016000500007
    - Diseño basado en experiencia de especialistas y guiado por el Programa Nacional de Atención Estomatológica Integral.
14. **Implementación de metodología UWE (Ingeniería Web basada en UML) para expedientes clínicos odontológicos** — Revista Tecnología Digital (México). URL: https://www.revistatecnologiadigital.com/pdf/12_007_metodologia_UWE_diseno_web_expedientes_clinicos_odontologicos.pdf
    - Metodología de diseño web formal (modelado de navegación) aplicada a registros odontológicos.
15. **Proyecto ODONTOVIDA (sistema de clínica dental)** — Univ. Alas Peruanas, Ingeniería de Sistemas. URL: https://es.slideshare.net/eltrome12/tesis-de-sistema-odontologico
16. **Tesis Ing. Sistemas con UI Tailwind CSS para software odontológico** — Calvo Arteaga (repo GitHub Pages). URL: https://calvocobos.github.io/Expo/
    - UI moderna, responsiva y personalizable con Tailwind; metodología ágil. (Validación externa del stack de NexoDent.)

### Fuentes complementarias (market/blogs técnicos — para contexto UX)
- UX Case Study: rediseño de TDO Software (endodoncia, SaaS B2B): https://sumili.medium.com/ux-ui-case-study-endodontic-practice-management-software-3a1fa9d9fe3b
- RevUp Dental "dentist-reviewed best systems" (agrega feedback de Reddit/Capterra/G2): https://revupdental.com/best-dental-practice-management-systems/
- Dentaltap (PWA dental — validación del enfoque PWA de NexoDent): https://dentaltap.com/mobile-app-for-dentistry/
- Guías ES 2025/26 de software dental (Dendoo, Softwaredoit): mencionan que "la usabilidad es clave" y acceso "desde cualquier dispositivo".

## 2. Patrones UX recurrentes en la literatura (accionables para NexoDent)

1. **Medir con SUS desde el día 1**: benchmark 68 = mínimo aceptable; apuntar a 80+. Test con 5-9 usuarios (Nielsen) por flujo crítico.
2. **Flujo de 1-2 clics por tarea crítica** (agenda, ficha paciente, cobro): los sistemas con más clics que el experto fracasan en adopción (Salud EDR).
3. **UI moderna "médica"**: diseño obsoleto ("Windows XP") es queja #1 y factor de rechazo; cuidado con pantallas densas de datos.
4. **Iconografía + etiquetas autodescriptivas**: iconos ambiguos = error frecuente; icono SIEMPRE con texto o tooltip.
5. **Terminología del dominio 1:1**: usar el vocabulario real del dentista (procedimiento, odontograma, pieza dental, "box" de atención), no términos inventados.
6. **Registro/agenda web como puerta de entrada**: los pacientes prefieren app web para gestionar citas (validado en tesis de citas con Scrum).
7. **Carga cognitiva baja**: agrupar por tarea clínica (modo atención) y no abrumar con menús profundos; el dentista atiende con guantes y prisa.
8. **Responsive/mobile-first como requisito**: acceso "desde cualquier dispositivo" es claim estándar; tablet en el box = patrón de uso real.
9. **PWA como vía legítima** (Dentaltap): no hace falta app nativa para la UI del staff; NexoDent puede diferenciar con app nativa del paciente después.
10. **Evaluación con métodos mixtos**: user testing + entrevistas + encuestas detectan problemas distintos (JADA); planificar ronda de tests con dentistas reales.
11. **Diseño guiado por dominio clínico**: partir de flujos reales (Programa de atención, tipos de consulta, especialidades) antes que de features genéricas.
12. **Metodología formal de diseño web** (UWE/agile): documentar navegación y rutas antes de codificar — los briefs secuenciales de NexoDent ya aplican esto.
