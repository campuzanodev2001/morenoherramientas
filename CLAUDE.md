# CLAUDE.md — Contexto global

## Sistema de implementación de features

Tu tarea es implementar las features de `feature-list.json` en orden,
una por una. Seguí este flujo sin excepción:

### Flujo obligatorio por feature

1. **Leer** la feature completa: descripción, acceptance criteria y
   cualquier documento de soporte referenciado
2. **Marcar** la feature como `IN_PROGRESS` en `feature-list.json`
3. **Implementar** la feature
4. **Verificar** cada acceptance criteria uno por uno — explicitá
   cuál pasa y cuál no en tu respuesta
5. Si algún AC no pasa: **corregir** e ir al paso 4 de nuevo
6. Solo cuando **todos los AC pasen**: marcar como `DONE`
7. **Commitear** con el mensaje: `feat: [nombre de la feature]`
   Incluir en el cuerpo del commit los ACs que cubre
8. **No avanzar** a la siguiente feature hasta completar el paso 7

### Reglas

- Solo una feature puede estar `IN_PROGRESS` a la vez
- Nunca marcar `DONE` sin haber verificado todos los AC explícitamente
- Si un AC es ambiguo, preguntar antes de implementar, no asumir
- Si la implementación de una feature rompe algo existente,
  resolverlo antes de marcar `DONE`
- Los documentos de soporte están en `docs/claude/`

### Estados válidos en feature-list.json

```
"status": "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED"
```

Usar `BLOCKED` si hay una dependencia externa que impide avanzar,
documentando el motivo en el campo `blockedReason`.

## El proyecto

Tienda online para ferretería argentina. Panel admin propio en /admin.
Compradores con o sin cuenta registrada.

El catálogo NO es de ferretería de hogar: es de **mecánica y taller**.
El grueso son bocallaves, llaves, extractores, mechas y herramientas de
puesta a punto de automotor. Tenerlo presente al escribir copy, categorías
o cualquier heurística sobre nombres de producto.

---

## Stack

| Área | Tecnología |
|---|---|
| Framework | Next.js 16 — App Router, React Server Components |
| Lenguaje | TypeScript 5 — modo estricto total |
| Estilos | Tailwind CSS v4 — sin UI libraries de terceros |
| Auth | NextAuth v5 — Google OAuth + credentials + invitado |
| Base de datos | PostgreSQL en Supabase (solo DB, no Auth ni Storage) |
| ORM | Drizzle ORM |
| Imágenes | Cloudinary — uploads firmados + transformaciones por URL |
| Pagos | MercadoPago Checkout Bricks |
| Envíos | Andreani + Correo Argentino |
| Mails | Resend + React Email |
| Deploy | Vercel |
| Validación | Zod — cliente, servidor y variables de entorno |
| Rate limiting | Upstash Redis |
| Monitoreo de errores | Sentry |
| Logs | Axiom (next-axiom) |

---

## Estructura de directorios

```
/
├── app/
│   ├── (store)/          → Storefront público
│   ├── (auth)/           → Login y registro
│   ├── admin/            → Panel admin propio (protegido por rol)
│   └── api/
│       ├── auth/
│       ├── admin/
│       ├── checkout/
│       ├── webhooks/mercadopago/
│       ├── envios/
│       ├── cron/
│       └── productos/
├── components/
│   ├── ui/               → Primitivos propios
│   ├── catalog/
│   ├── cart/
│   ├── checkout/
│   ├── admin/
│   └── feedback/         → Toast, Skeleton, ErrorBoundary
├── lib/
│   ├── db/               → Drizzle client + schemas + migraciones
│   ├── auth/
│   ├── payments/
│   ├── shipping/
│   ├── mail/
│   ├── cloudinary/
│   ├── validations/      → Schemas Zod compartidos
│   ├── errors/           → Jerarquía de errores custom
│   ├── logger/           → Axiom + Sentry helpers
│   ├── rate-limit/
│   └── utils/
├── scripts/              → Pipeline de catálogo (ver "Datos del catálogo")
├── data/                 → Planillas del cliente y salidas del pipeline.
│                           GITIGNORED: tiene precios de costo y márgenes.
└── middleware.ts
```

---

## TypeScript — sin excepciones

```
{ "strict": true, "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true, "exactOptionalPropertyTypes": true }
```

- Sin `any`. Sin `as unknown as X` salvo casos documentados.
- Tipos de Drizzle exportados desde `lib/db/types.ts`.
- Props siempre tipadas con interfaces explícitas.

---

## Seguridad — orden obligatorio en toda API route

```typescript
export async function POST(request: Request) {
  try {
    // 1. Rate limiting
    // 2. Autenticación
    // 3. Autorización
    // 4. Validación Zod del body
    // 5. Lógica de negocio
    // 6. Respuesta controlada
  } catch (error) {
    return handleApiError(error)
  }
}
```

- Precios: siempre recalculados en servidor antes de crear preferencia de pago
- Stock: se descuenta SOLO en el webhook de MP, nunca antes
- Órdenes: siempre filtrar por `userId === session.user.id`
- Uploads: firmados desde servidor, nunca exponer `CLOUDINARY_API_SECRET`
- Errores: nunca exponer stack traces al cliente
- Errores no operacionales: siempre reportar a Sentry con `Sentry.captureException(error)`
- Logs: usar `console.log/error/warn` normalmente — Axiom los captura automáticamente via next-axiom

---

## Convenciones

```
PascalCase  → componentes, tipos, interfaces
camelCase   → funciones, variables, props
kebab-case  → archivos, carpetas, slugs
UPPER_SNAKE → constantes y env vars
```

- Server Components por defecto. Client Components solo con interactividad real.
- Sin `useEffect` para fetching — Server Components o SWR.

---

## UX — el usuario siempre sabe qué pasa

- Carga → Skeleton en Suspense boundaries (nunca spinner suelto)
- Acción → botón deshabilitado + estado visual
- Error de validación → inline por campo, en tiempo real
- Error de pago → mensaje según código de MP (ver `lib/errors/mp-error-messages.ts`)
- Upload → barra de progreso + preview inmediato

---

## Variables de entorno (validadas con Zod en `lib/env.ts`)

```env
DATABASE_URL=
DIRECT_URL=          # Supabase session pooler (puerto 5432) — usado solo por Drizzle Kit para migraciones
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
NEXT_PUBLIC_MP_PUBLIC_KEY=
ANDREANI_API_KEY=
ANDREANI_CLIENT_ID=
CORREO_ARG_USER=
CORREO_ARG_PASSWORD=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=

# Monitoreo
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
AXIOM_TOKEN=
AXIOM_DATASET=
```

### Nota sobre DATABASE_URL y DIRECT_URL

Supabase expone dos connection strings distintas para el mismo proyecto:

- **DATABASE_URL** → Transaction pooler, puerto **6543**, con `?pgbouncer=true`.
  Es la que usa la app en runtime (todas las queries de Drizzle en producción
  sobre Vercel serverless). Reutiliza un pool de conexiones, evita agotar el
  límite de conexiones de Supabase con funciones serverless concurrentes.

- **DIRECT_URL** → Session pooler / conexión directa, puerto **5432**.
  Se usa ÚNICAMENTE en `drizzle.config.ts` para correr migraciones
  (`drizzle-kit generate` / `drizzle-kit migrate`). Las migraciones no
  funcionan bien a través del transaction pooler.

Nunca usar DIRECT_URL en runtime de la app — agotaría las conexiones
disponibles en el plan Free de Supabase.

---

## Datos del catálogo — estado y pipeline

Última actualización: 2026-08-07.

### Estado actual de la DB

```
1743 productos · 0 sin categoría · 22 categorías
1743 con descripción (100%)
1713 con al menos una spec · 904 con 3 o más · promedio 2,95
  30 sin ninguna spec  ← sin marca y sin dato técnico en ninguna fuente
 769 con imágenes      ← 2770 fotos de ML, máximo 6 por producto
   2 inactivos         ← margen cero, esperando confirmación del cliente
```

Origen de las specs: 334 de catálogo oficial de marca (Bremen 313 +
Lusqtoff 21), 801 derivadas del nombre, 608 solo con marca.

Las descripciones se componen a partir de datos verificados: nombre, marca,
specs confirmadas y el texto del fabricante cuando el catálogo lo trae. No
afirman usos ni prestaciones que no estén respaldados.

Los 12 productos mock del seed fueron borrados, junto con los scripts de datos
de prueba (`seed-mock-products.ts`, `seed-test-product.ts`, `assign-demo-images.ts`).
La DB solo tiene datos reales del cliente.

### Origen de los datos

El cliente manda `STOCK MORENO HERRMIENTAS.xlsx` (8375 filas, hoja única).
Columnas: `Código, Producto, P. Costo, P. Venta, P. Mayoreo, Departamento,
Existencia, Inv. Mínimo, Inv. Máximo, Tipo de Venta, Proveedor`.

Solo se publican las filas con `Existencia > 0` (1745; 2 se descartan por no
tener nombre → 1743). Las ~6350 filas con `Existencia = "-"` no significan
"sin stock" sino que el cliente no les lleva control.

### 🔴 El precio de costo viene embebido en el nombre

`"Batea Lavapiezas PALLADINO/420000/"` → ese `/420000/` es el **P. Costo**,
NO el precio de venta. Verificado: de 2033 filas con ese patrón, 1994
coinciden exacto con la columna P. Costo y 0 con P. Venta.

**Se publica `P. Venta`. `P. Costo` no sale nunca de `data/`.**

El script viejo `import-products.ts` publicaba el costo como precio público;
por eso se borró. No resucitarlo.

Al limpiarlo, el patrón hay que anclarlo al final del nombre. Buscarlo suelto
rompe los nombres que terminan en fracción: `"Enc 1/2/6999/"` pierde el `2` y
deja el `6999` (el costo) en el título. Pasó, son 17 productos.

### Pipeline

```
xlsx → CSV → clean-stock.ts → productos-limpios.json → import-stock.ts → DB
                                        ↓
                            enrich-bremen.ts → specs-bremen.json
                                        ↓
                              apply-specs.ts → DB
                                        ↓
                           apply-categories.ts → DB
```

| Script | Qué hace |
|---|---|
| `clean-stock.ts` | Limpia nombres, saca códigos y notas internas, Title Case |
| `import-stock.ts` | Inserta/actualiza por `sku`. Idempotente. Tiene `--dry-run` |
| `enrich-bremen.ts` | Specs desde el catálogo Bremen (formato columnas) |
| `enrich-catalog.ts` | Specs desde catálogos con ficha por producto (Lusqtoff) |
| `apply-specs.ts` | Combina specs de catálogo + derivadas del nombre → DB |
| `apply-categories.ts` | Crea la taxonomía y asigna categoría a cada producto |

Todos son re-ejecutables. `import-stock.ts` es también el camino para
refrescar precios y stock cuando llega una planilla nueva.

`data/` está en `.gitignore`: contiene precios de costo y márgenes.

### Criterios acordados con el cliente

- **Fuentes**: catálogo oficial y distribuidor oficial se aceptan directo.
  Un retailer suelto (MercadoLibre, ferreterías) solo cuenta si dos fuentes
  independientes coinciden. Si no se puede verificar, **el producto queda sin
  specs y se anota el motivo**. Nunca inventar un dato.
- **Procedencia**: va en `data/procedencia-specs.json`, no en la ficha que ve
  el comprador.
- **Specs derivadas del nombre**: sí, marcadas como tales. Salen del texto que
  cargó el cliente, no de inferir qué debería tener el producto.
- **Cola larga**: priorizar por valor de inventario (precio × stock), no por
  cantidad de productos.
- Los códigos salen del título; los de fábrica van a `specs`.
- Datos logísticos del catálogo (`UNIDAD POR BULTO`, `PRESENTACIÓN`) se
  descartan: son de mayorista, no le sirven al comprador.

### Trampa al parsear catálogos PDF

El catálogo Bremen (506 páginas) es tabular y al pasarlo a texto queda como
columnas apiladas, alineadas por posición:

```
CÓDIGO  3460 3461 3462 ...      MATERIAL  Cr-V
MEDIDA  8 mm 9 mm 10 mm ...     ENCASTRE  1/2"
```

Si una página trae varias familias de productos, el orden del texto NO alcanza
para saber a qué familia pertenece cada columna. Emparejar por orden produce
errores silenciosos: al código 6342 (pinza de 8") le asignó 6".

**Regla que resolvió esto**: solo una columna **por variante** (medida, largo)
puede validar el emparejamiento. Que coincida el material no prueba nada,
porque suele ser el mismo en toda la página aunque la columna esté mal
asignada. Todo lo asignado se contrasta además contra el nombre del propio
producto, y si hay contradicción se descarta el producto entero.

Aplicar el mismo criterio a cualquier catálogo nuevo.

### Cobertura por marca

87 marcas. Las 8 primeras son el 73% del catálogo.

| Marca | Productos | Estado |
|---|---|---|
| Bremen | 486 | ✅ 313 con specs verificadas (catálogo PDF oficial) |
| Lusqtoff | 78 | ✅ 21 verificadas. 43 no están en el catálogo 2024-25 |
| Eurotech | 333 | ⚠️ catálogo hallado pero de formato pobre (ver abajo) |
| Bosch | 103 | pendiente; cruzable por código de fábrica y por EAN |
| Rutmann, DeWALT, PZ Force, GD Tools | 271 | pendiente |
| Resto (75 marcas) | 472 | solo specs derivadas del nombre |

**Catálogos ya descargados** (en `data/`, gitignored): Bremen, Lusqtoff y
dos de Eurotech. El segundo de Eurotech (`eurotech2.pdf`) es escaneado y no
tiene capa de texto: inútil sin OCR.

**Eurotech**: el catálogo público (`eurotech.pdf`, 33 págs) no usa
`etiqueta: valor` sino `# CÓDIGO` suelto con texto libre alrededor, con la
misma ambigüedad de asignación que Bremen pero sin columnas que permitan
verificar. 134 de los 333 SKU aparecen en el PDF, así que hay material, pero
extraerlo con garantías necesita un parser propio. Sigue siendo el hueco
más grande y lo más rentable a atacar.

Para las marcas internacionales el **SKU es el EAN**, así que hay dos claves
de cruce independientes (código de fábrica y EAN) y una valida a la otra.

### Errores en los datos del cliente, ya detectados

- `6909` "Manija de Fuerza **Enc 1/5**" — ese encastre no existe. El catálogo
  Bremen dice 1/2. Error de tipeo.
- `6338` Alicate corte oblicuo: el nombre dice 6", el catálogo 8".
- 2 productos a **margen cero** (venta = costo), cargados con `active: false`:
  `7795163034605` bocallave Bremen y `7798325011612` clavadora Omaha.
- 3 pares de **nombres duplicados** con precios distintos: `Mecha HSS 11.50mm`,
  `Extractor de Volante Magnètico M16` (los códigos dicen M16 y M20, los dos
  nombres dicen M16) y `Llave Corta Combinada -14mm`.
- 2 filas **sin nombre** (solo un código): `6917` y `7795163035213`.
- 1 producto con la nota interna "cuando se venda eliminarlo de la lista":
  el cliente no piensa reponerlo.

### Pendientes

1. **Preguntarle al cliente por el recargo Taiwán.** 6 productos traían
   `(ATENCION TAIWAN +$10000)` en el nombre. La nota se sacó, pero hay que
   confirmar si ese recargo YA está aplicado en `P. Venta`. Si no lo está,
   esos 6 se publican baratos y se pierde la diferencia en cada venta.
2. **Conseguir el catálogo de Eurotech** (333 productos). Es marca de
   importador argentino: lo más probable es que exista en PDF y circule por el
   canal mayorista, no por la web abierta. Pedírselo al cliente o al proveedor.
3. Specs de Bosch, Rutmann, Lusqtoff, DeWALT, PZ Force, GD Tools.
4. **Descripciones**: redactarlas a partir de las specs ya verificadas, sin
   agregar ningún dato nuevo. Es reformulación, no generación.
5. **Imágenes**: 769 productos ya tienen fotos (vía MercadoLibre). Faltan
   los 974 restantes, que no tienen SKU en formato EAN y por eso no se
   pueden cruzar contra ML. Su única vía son los catálogos de marca.
6. Resolver los casos especiales de la lista de arriba.

---

## Regla de oro

Antes de avanzar al siguiente prompt:
1. Compila sin errores de TypeScript
2. Sin `any` nuevo
3. Flujo principal funciona en local
4. Errores visibles al usuario, nunca pantalla en blanco

---

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
