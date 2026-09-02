# BRIEF-CODEX-DEPLOY: NexoDent en Coolify — diagnóstico del 503

## Contexto del proyecto
NexoDent: SaaS dental multi-tenant (Next.js 16 standalone + PostgreSQL 17 + Drizzle + Better Auth + RLS forzado).
Repo: https://github.com/nexolab-ia/nexodent (público, main). Deploy en Coolify v4.3.14 (panel.nexolabs.cloud).

## Arquitectura del deploy (docker-compose.yaml en raíz del repo)
3 servicios construidos desde un Dockerfile multi-stage:
- `postgres`: postgres:17-alpine, volumen postgres_data, healthcheck pg_isready. **No expuesto al host.**
- `provision`: build target `worker` (imagen con node_modules + db/), corre `node_modules/.bin/tsx db/provision.ts` UNA vez: crea rol app `nexodent_app` NOSUPERUSER NOBYPASSRLS, aplica 7 migraciones SQL (tabla control `_nexodent_schema_migrations`), grants al rol app, seed demo (Clínica Sonrisa Andes + 20 pacientes + credencial Better Auth de emilia.demo@nexodent.invalid). ACTUALMENTE con `sleep 600` al final para poder leer logs (debug temporal).
- `web`: build target `web` (Next standalone), CMD node server.js, EXPOSE 3000, healthcheck wget http://127.0.0.1:3000/api/health/ready (30s/5s/3). Env: DATABASE_URL (rol app nexodent_app), AUTH_SECRET, AUTH_URL, APP_URL.

Dockerfile multi-stage: deps (npm ci) → build (next build) → web (standalone + static + public, USER nexodent) / worker (tsx + db).

## Estado actual (verificado hace minutos)
- Deploy en Coolify terminó `finished` (deployment 5owtws4mvw8jqjkyvmdtajtt). Los 3 contenedores arrancan.
- Provision CORRE BIEN: logs muestran "Provision: aplicadas 7 migraciones... fixture demo cargado... credencial demo creada... PROVISION_EXIT=0".
- PERO la app queda `running:unhealthy` y https://dental.nexolabs.cloud/api/health/ready responde **503 "no available server"** (Traefik no encuentra backend). También probado directo al origen con `curl --resolve dental.nexolabs.cloud:443:212.56.43.70`.
- MCP get_logs / REST logs SIEMPRE devuelven el log del contenedor `provision` (Coolify asocia el log de la app dockercompose al primer servicio del compose), NUNCA el del `web`. No hemos podido ver si el web arranca, crashea, o no escucha.

## Lo que ya se corrigió (3 bugs encontrados)
1. Passwords corruptos por filtro de seguridad de Hermes al guardar envs en Coolify (las URLs DATABASE_URL* quedaron con `***` literal) → reconstruidas por concatenación.
2. Env vars duplicadas en Coolify (28 entradas = 14 keys × 2, una copia VACÍA por key; el contenedor recibía la vacía) → eliminadas 12 copias vacías (quedan 14 keys con valor + SERVICE_URL_WEB/FQDN duplicadas con valor idéntico).
3. `ports_exposes` estaba en 80 → PATCH a 3000 (el web escucha en 3000).

## Preguntas para resolver
1. ¿Cómo obtener los logs REALES del contenedor `web` en una app dockercompose de Coolify v4.3.14? (REST / MCP). El contenedor docker se llama web-p7usgkmgpmkpylodnbrogox8-<hash>.
2. ¿Por qué Traefik responde "no available server" si el deploy terminó y el web "Started"? ¿Es el healthcheck del contenedor el que falla (unhealthy → Traefik lo retira)? ¿El web realmente escucha en 3000?
3. Hipótesis a validar: (a) el web crashea al arrancar por env faltante/malformada; (b) el healthcheck wget falla porque el web tarda >90s en estar listo; (c) Traefik no tiene el label de puerto (en el compose parseado NO aparece `traefik.http.services...loadbalancer.server.port`); (d) el USER nexodent no puede escribir algo en /app.
4. Revisar en el detalle de la app (GET /api/v1/applications/p7usgkmgpmkpylodnbrogox8) el campo `docker_compose` (parseado por Coolify con labels inyectados) y `docker_compose_raw`. Confirmar si faltan labels de Traefik para el servicio web o el puerto.

## Acceso
- Helpers API (NO escribir tokens inline; leerlos por archivo):
  - `/home/hermes/.hermes/home/bin/coolify_api.sh GET|POST|PATCH|DELETE "/api/v1/..." ["json"]`
  - `/home/hermes/.hermes/home/bin/mcp_call.py <tool> '<json-args>'` (MCP: get_logs, get_application, search_resources, control, list_applications)
- Envs de la app: GET /applications/p7usgkmgpmkpylodnbrogox8/envs
- Deployments: GET /deployments/<uuid>
- Logs REST: GET /applications/p7usgkmgpmkpylodnbrogox8/logs?lines=N (devuelve SOLO el provision)
- Datos demo: usuario emilia.demo@nexodent.invalid (password en /home/hermes/.hermes/home/.secrets/nexodent_deploy.env, clave DEMO_PASSWORD)
- Server uuid: xlwjbld82gunwsk8m6myooau (localhost). Red coolify: 2ri2i4gxwhjyndzadndeprtu. Proyecto NexoDent: l6octdi1tiygxai31wqtjycg. App: p7usgkmgpmkpylodnbrogox8. Dominio: dental.nexolabs.cloud → CNAME vps.nexolabs.cloud (212.56.43.70).

## Reglas
- NO modifiques el código del repo todavía. Primero DIAGNOSTICA y propón el fix mínimo.
- NO despliegues nada sin decir exactamente qué comando usarás.
- No imprimas secretos.
- Al terminar crea REPORTE-CODEX-DEPLOY.md en el repo dental-saas (o en /tmp si no hay repo) con hallazgos y fix propuesto, y DETENTE.
