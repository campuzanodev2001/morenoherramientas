# todo.md — Pasos para dejar la página en producción

Estado: **las 40 features de `feature_list.json` están en `DONE`** (código completo,
`tsc`/`eslint`/`next build` en verde). Lo que queda es **operativo**: provisionar
servicios reales, cargar datos, desplegar y verificar el flujo con dinero real.

**Camino crítico** (si falta algo de acá, no funciona):
DB migrada → catálogo importado → usuario admin → env vars en Vercel → webhook de MP registrado.
El resto es verificación.

---

## Fase 1 — Provisionar servicios y juntar credenciales

Crear las cuentas y obtener las claves de cada integración (todas tienen su lugar en
`lib/env.ts` / `.env.example`). Las marcadas ✅ ya están cargadas con valores reales en
`.env.local` (al 30 jun 2026):

- [x] **Supabase** → `DATABASE_URL` (pooler 6543) + `DIRECT_URL` (5432) cargados ✅
- [ ] **MercadoPago** → credenciales **sandbox** primero (`TEST-...`) y luego prod:
      `MP_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET` *(pendiente)*
- [x] **Cloudinary** → cloud `dlj5r4rze`, `API_KEY` / `API_SECRET` + el público ✅
- [x] **Resend** → `RESEND_API_KEY` cargada ✅ — **pero** usando remitente de prueba
      `onboarding@resend.dev`; falta verificar el dominio (DNS) y volver a
      `ventas@morenoherramientas.com`
- [x] **Upstash Redis** → `UPSTASH_REDIS_URL` / `TOKEN` (REST) cargados ✅
- [ ] **Google OAuth** → `GOOGLE_CLIENT_ID` / `SECRET` (con redirect URI de prod) *(pendiente)*
- [ ] **Andreani / Correo Argentino** → credenciales reales de carrier *(pendiente)*
- [x] **Sentry / Axiom** → DSN, `org=campuzano-web-design`, `project=morenoherramientas`,
      auth token, `AXIOM_TOKEN`, `AXIOM_DATASET=morenoherramientas` ✅
- [ ] Generar `NEXTAUTH_SECRET` y `CRON_SECRET` (≥32 chars aleatorios) *(siguen placeholder)*

---

## Fase 2 — Base de datos

- [ ] Aplicar las migraciones Drizzle a la DB de Supabase (incluye la migración `0000`
      y la de `pg_trgm` + índices GIN)
- [ ] Verificar que la extensión `pg_trgm` quedó habilitada
- [ ] Confirmar que las 16 tablas existen

---

## Fase 3 — Cargar el catálogo real

Con `DATABASE_URL` real en `.env.local`, exportar el Excel del proveedor a CSV UTF-8 y
correr **en orden**:

```bash
npx tsx --env-file=.env.local scripts/generate-categories.ts
npx tsx --env-file=.env.local scripts/import-products.ts ./data/STOCK.csv
```

- [ ] Revisar `import-report.txt` (procesadas / insertados / actualizados / errores)
- [ ] Revisar `import-errors.log` (filas sin precio o sin código)
- [ ] Recategorizar desde el admin lo que cayó en `sin-categorizar`

---

## Fase 4 — Crear el usuario admin

No hay UI de "crear admin".

- [ ] Registrar un usuario y promover su `role` a `admin` directo en la DB (o un seed)

> Sin esto no se puede entrar a `/admin`.

---

## Fase 5 — Deploy en Vercel

- [ ] Conectar el repo a Vercel
- [ ] Cargar **todas** las env vars, con:
  - `NEXTAUTH_URL` = URL de prod **sin slash final**
  - `NEXT_PUBLIC_APP_URL` = misma URL
- [ ] Verificar que el cron `*/5` (de `vercel.json`) quedó activo en el dashboard
      (`maxDuration 30` del webhook ya viene configurado)
- [ ] Deploy y comprobar que el build pasa

---

## Fase 6 — Conectar webhooks y OAuth (una vez que hay URL de prod)

- [ ] **MercadoPago**: registrar el webhook en
      `https://TU-DOMINIO/api/webhooks/mercadopago` y cargar el `MP_WEBHOOK_SECRET`
      correspondiente a esa firma
- [ ] **Google OAuth**: agregar el redirect URI de producción
      (`https://TU-DOMINIO/api/auth/callback/google`)
- [ ] **Resend**: verificar el dominio del remitente

---

## Fase 7 — QA end-to-end (todavía en sandbox de MP)

Probar el flujo real, no solo el build:

- [ ] Registro/login (Google + credentials + invitado)
- [ ] Búsqueda, navegación por categorías, ficha de producto
- [ ] Carrito anónimo → login → **merge**
- [ ] Checkout 4 pasos → **cotización real** de Andreani/Correo
- [ ] Pago con tarjeta de prueba → llega el **webhook** → orden `confirmed` +
      **stock descontado** + mail de confirmación
- [ ] Pago rechazado → orden `cancelled` + mail
- [ ] Cron: dejar una orden `pending` >30 min y verificar que se cancela
- [ ] Admin: transiciones de estado, `markAsShipped` con tracking → mail de envío
- [ ] Verificar que los errores llegan a **Sentry** y los logs a **Axiom**

---

## Fase 8 — Go-live (switch a producción de MP)

- [ ] Reemplazar credenciales `TEST-` por las productivas de MercadoPago
- [ ] Hacer **una compra real chica de punta a punta** (cobro + webhook + stock + mail en prod)
- [ ] Confirmar HTTPS, security headers/CSP y que `/admin`, `/api`, `/cuenta` están
      bloqueados en `robots.ts`

---

## A decidir antes de abrir al público

- **Sin tests automatizados versionados** (hay Playwright como dependencia, pero no una
  suite). Para algo que mueve dinero, conviene al menos un smoke test E2E del checkout.
- **Carriers**: con placeholders usan estimación determinística; hay que confirmar que la
  integración real de Andreani/Correo responde como se espera (es lo más propenso a
  sorpresas en producción).
