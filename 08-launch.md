# 08-launch.md
# Cargar este archivo cuando estés listo para deployar a producción

---

## Cuándo usar este archivo

- Preparando el deploy a Vercel
- Haciendo la importación masiva de productos
- Auditando seguridad antes de lanzar
- Configurando SEO y performance final

---

## Script de importación masiva

> ⚠️ **ESTA SECCIÓN QUEDÓ OBSOLETA (2026-08-06).**
> La importación masiva ya está hecha y documentada en CLAUDE.md, sección
> "Datos del catálogo — estado y pipeline". Los scripts vigentes son
> `clean-stock.ts` → `import-stock.ts`. `scripts/import-products.ts` fue
> **borrado** y no hay que resucitarlo.
>
> El error que tenía este documento: **el número embebido en el nombre NO es
> el precio de venta, es el PRECIO DE COSTO.** Verificado sobre la planilla
> real: de 2033 filas con ese patrón, 1994 coinciden exacto con la columna
> `P. Costo` y 0 con `P. Venta`. Seguir estas instrucciones publicaba los
> márgenes de la ferretería como precio al público.
>
> Se publica `P. Venta`. Ver CLAUDE.md antes de tocar nada de esto.

### El Excel real tiene esta estructura
```
Código       → SKU del producto
Producto     → "NOMBRE DEL PRODUCTO /COSTO/"  ← es el COSTO, no el precio
P. Costo     → precio de costo. NUNCA se publica
P. Venta     → el precio que va a la tienda
Departamento → marca del fabricante (no es una categoría)
Existencia   → stock actual ("-" = el cliente no lleva control, no es 0)
```

### Categorización automática por palabras clave

> ⚠️ **OBSOLETO.** Estas 10 categorías genéricas de ferretería de hogar
> dejaban el 64% del catálogo en "sin-categorizar", porque este catálogo es
> de mecánica y taller. La taxonomía vigente son 21 categorías definidas en
> `lib/catalog/categorization.ts` y aplicadas con `apply-categories.ts`:
> deja 4 productos sin categorizar sobre 1743 (0,2%).

Mapa de palabras clave → slug de categoría:
```
taladro, amoladora, sierra, lijadora, atornillador  → herramientas-electricas
martillo, alicate, destornillador, llave, serrucho  → herramientas-manuales
tornillo, tuerca, clavo, arandela, bulón, perno     → tornilleria
caño, llave de paso, válvula, sifón, grifería       → plomeria
cable, enchufe, tomacorriente, disyuntor, llave termomagnética → electricidad
pintura, rodillo, pincel, sellador, enduído         → pintura
cemento, arena, ladrillos, malla, hierro            → construccion
manguera, aspersor, rastrillo, pala                 → jardin
candado, cerradura, alarma, cadena                  → seguridad
```
Los que no matcheen ninguna categoría → `sin-categorizar`.

### Inserción

- Lotes de 100 registros con `ON CONFLICT (sku) DO UPDATE`
- Si el SKU ya existe: actualizar nombre y precio sin duplicar
- Slug único: si hay conflicto, agregar el SKU al final

### Reporte final
```
import-report.txt:
  Total filas procesadas: X
  Insertados: X
  Actualizados: X
  Errores: X

import-errors.log:
  [fila] [motivo] [datos de la fila]
```

### Orden de ejecución
```bash
npx tsx scripts/generate-categories.ts    # primero
npx tsx scripts/clean-stock.ts data/stock-raw.csv
npx tsx --env-file=.env.local scripts/import-stock.ts
```

---

## SEO

### sitemap.ts
- Generar dinámicamente con todas las categorías y productos activos
- Límite de 50.000 URLs (límite de Google)
- Prioridad: home (1.0), categorías (0.8), productos (0.6)

### robots.ts
Bloquear:
```
/admin
/api
/cuenta
/checkout
/login
/registro
```

### Structured data
- Página de producto: `Product` schema con precio, disponibilidad y breadcrumbs
- Home: `WebSite` schema con `SearchAction`

---

## Performance — checklist

- [ ] Sin Client Components innecesarios (revisar que no tengan 'use client' sin interactividad)
- [ ] `loading.tsx` en cada segmento de ruta
- [ ] `error.tsx` en cada segmento de ruta
- [ ] `not-found.tsx` en `/`, `/producto/[slug]` y `/categoria/[slug]`
- [ ] Todas las imágenes con `next/image` y `sizes` definido
- [ ] Sin `useEffect` para fetching de datos

---

## Auditoría de seguridad — checklist completo

### Endpoints y autorización
- [ ] Ningún endpoint devuelve datos de otros usuarios
- [ ] Todas las queries de órdenes filtran por `userId`
- [ ] Acceder a `/cuenta/ordenes/[id-ajeno]` devuelve 404, no los datos
- [ ] El panel `/admin/ordenes` requiere `role = admin`
- [ ] Acceder a `/admin` sin ser admin redirige correctamente

### Precios y pagos
- [ ] Los precios del checkout se recalculan en el servidor
- [ ] El webhook de MP valida la firma antes de cualquier operación
- [ ] El stock solo se descuenta en el webhook, nunca antes
- [ ] Simular manipulación de precios desde el cliente → debe usar el precio de la DB

### Autenticación
- [ ] Rate limiting activo: 5 intentos de login por IP cada 15 minutos
- [ ] Más de 60 requests/min a una API route → 429 con Retry-After
- [ ] Los tokens de NextAuth y Payload no se mezclan

### Datos sensibles
- [ ] `MP_ACCESS_TOKEN` no aparece en logs del cliente
- [ ] `passwordHash` nunca se devuelve en ningún endpoint
- [ ] Las keys de Cloudinary, Andreani y Correo Argentino no son accesibles desde el cliente

### Configuración
- [ ] `.env` no está en el repositorio
- [ ] Security headers activos (verificar con securityheaders.com)
- [ ] HTTPS forzado, sin mixed content

---

## Vercel — configuración final

### vercel.json
```json
{
  "crons": [
    {
      "path": "/api/cron/cancelar-ordenes-pendientes",
      "schedule": "*/5 * * * *"
    }
  ],
  "functions": {
    "app/api/webhooks/mercadopago/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### Variables de entorno en Vercel
- `MP_ACCESS_TOKEN` en producción: credenciales reales (no sandbox)
- `NEXT_PUBLIC_MP_PUBLIC_KEY` en producción: clave pública real
- `CRON_SECRET`: string aleatorio de al menos 32 caracteres
- `NEXTAUTH_URL`: URL de producción sin slash final

---

## Tests manuales antes del lanzamiento

```
□ Sentry configurado y verificado (tirar un error de prueba)
□ Axiom conectado y capturando logs (verificar en dashboard)
□ Alertas de Sentry configuradas para errores en /api/webhooks/mercadopago
□ Flujo completo como invitado:
  agregar producto → checkout → pagar (sandbox MP) → mail de confirmación

□ Flujo completo como usuario registrado con Google:
  login → agregar → checkout → pagar → mail → ver en cuenta/ordenes

□ Pago rechazado:
  mensaje correcto al usuario + mail de PaymentFailed

□ Pago pendiente:
  orden queda en pending, mail NO se envía aún

□ Webhook duplicado:
  enviar el mismo webhook dos veces → mail enviado solo una vez

□ Admin — ciclo de vida de una orden:
  confirmed → processing → shipped (con tracking) → delivered

□ Precio cambiado:
  crear orden → cambiar precio del producto en Payload →
  verificar que la orden conserva el precio original

□ Producto desactivado:
  desactivar desde Payload → verificar que no aparece en catálogo

□ Cron job:
  crear orden pending manualmente → esperar 35 min → verificar cancelación

□ Rate limiting:
  5 intentos de login fallidos → verificar 429 en el 6to intento

□ Seguridad de órdenes:
  loguearse como usuario A → intentar acceder a orden de usuario B →
  debe devolver 404
```

---

## Prompt de esta área

### PROMPT 14 — Importación masiva y SEO

```
Implementá la importación masiva de productos y las optimizaciones de SEO.

1. Creá scripts/generate-categories.ts:
   Inserta las categorías predefinidas si no existen. Ejecutar primero.

2. Creá scripts/import-products.ts:
   Acepta la ruta al archivo Excel como argumento.
   Implementar los 6 pasos definidos en 08-launch.md.
   Generar import-report.txt e import-errors.log al terminar.

3. Creá app/sitemap.ts con generación dinámica.
   Creá app/robots.ts bloqueando las rutas sensibles.

4. Agregá structured data en app/(store)/producto/[slug]/page.tsx.

5. Creá loading.tsx, error.tsx y not-found.tsx en todos los segmentos
   de ruta que falten.

6. Ejecutá la auditoría de seguridad completa del checklist de 08-launch.md.
   Por cada item que falle, aplicar el fix antes de continuar.

7. Configurá vercel.json con el cron job y el timeout del webhook.

8. Documentar en README.md:
   - Orden de ejecución de los scripts
   - Variables de entorno requeridas y sus valores de ejemplo
   - Diferencia entre credenciales de sandbox y producción de MP
```
