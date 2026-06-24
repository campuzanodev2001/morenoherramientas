# 06-admin.md
# Cargar este archivo cuando trabajés en: panel de órdenes del admin, gestión de estados

---

## Cuándo usar este archivo

- Implementando el panel de gestión de órdenes
- Creando el dashboard del admin
- Trabajando con transiciones de estado de órdenes

---

## Panel de órdenes — /admin/ordenes

Separado del CMS de Payload. Accesible solo con `requireRole('admin')`.

### Listado de órdenes
- Columnas: número de orden, fecha, cliente (email), estado (badge), total
- Filtros: por estado, por rango de fechas
- Búsqueda: por número de orden o email del cliente
- Paginación server-side
- Server Component con revalidación cada 60 segundos

### Detalle de una orden
- Items con imágenes, cantidades y precios unitarios
- Datos del comprador y dirección de envío completa
- Timeline del estado de la orden
- Historial de eventos de pago (desde `payment_events`)
- Acciones disponibles según el estado actual

---

## Transiciones de estado válidas

```
pending    → confirmed   (solo via webhook MP, no manual)
pending    → cancelled   (cron job o cancelación manual)
confirmed  → processing  (admin)
processing → shipped     (admin, requiere trackingNumber)
shipped    → delivered   (admin)
confirmed  → cancelled   (admin, solo si el pago no fue completado)
```

Cualquier otra transición debe ser rechazada con un error claro.

---

## Server Actions del admin en lib/admin/order-actions.ts

```typescript
markAsProcessing(orderId: string)
  → confirmed → processing
  → requireRole('admin')
  → Validar transición

markAsShipped(orderId: string, trackingNumber: string, carrier: string)
  → processing → shipped
  → requireRole('admin')
  → Validar transición
  → Guardar trackingNumber y carrier
  → Disparar sendOrderShipped()

markAsDelivered(orderId: string)
  → shipped → delivered
  → requireRole('admin')
  → Validar transición
  → Disparar sendOrderDelivered()

cancelOrder(orderId: string)
  → Solo desde pending o confirmed
  → requireRole('admin')
  → Nunca si el pago fue aprobado en MP (verificar mpStatus)
```

Todas las acciones loggean: quién hizo el cambio, cuándo, estado anterior y nuevo.

---

## UX del panel de órdenes

- Botones de acción habilitados solo si la transición es válida desde el estado actual
- Feedback de loading mientras la acción está en curso
- Confirmación modal antes de acciones irreversibles (marcar como enviado, cancelar)
- Feedback de éxito/error inmediato sin recargar la página

---

## Dashboard — /admin

Métricas del día (Server Component, sin tiempo real):
- Órdenes nuevas (status `confirmed` + `processing`)
- Ingresos del día
- Órdenes pendientes de procesar

Accesos directos a: catálogo (Payload), órdenes, banners.

---

## Prompt de esta área

### PROMPT 12 — Panel de órdenes admin

```
Implementá el panel de gestión de órdenes para el admin.

1. Creá app/admin/ordenes/page.tsx:
   Server Component protegido con requireRole('admin').
   Listado de órdenes con filtros, búsqueda y paginación server-side.
   Revalidación cada 60 segundos.

2. Creá app/admin/ordenes/[id]/page.tsx:
   Detalle completo con items, datos del comprador, historial de payment_events
   y timeline de estados.
   Verificar que el admin solo accede a órdenes existentes (no a datos de otros
   recursos sensibles).

3. Creá lib/admin/order-actions.ts con los 4 Server Actions definidos
   en 06-admin.md. Todos requieren requireRole('admin'). Todos validan
   la transición de estado antes de ejecutar. Todos loggean el cambio.

4. Los botones de acción en el detalle de orden:
   - Solo visibles y habilitados si la transición es válida
   - Modal de confirmación para acciones con consecuencias (shipped, cancel)
   - Loading state mientras la Server Action está en curso
   - Feedback de éxito/error sin recargar la página entera

5. Creá app/admin/page.tsx con el dashboard: métricas del día y accesos
   directos.

6. Hookear sendOrderShipped y sendOrderDelivered en sus respectivas
   Server Actions (ver 05-notifications.md).
```
