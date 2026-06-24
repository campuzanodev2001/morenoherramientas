# 07-account.md
# Cargar este archivo cuando trabajés en: cuenta del cliente, perfil, historial de órdenes

---

## Cuándo usar este archivo

- Implementando el área de cuenta del cliente
- Creando el perfil y cambio de password
- Mostrando el historial de órdenes del cliente

---

## Rutas de cuenta

```
/cuenta                 → redirige a /cuenta/perfil
/cuenta/perfil          → datos del usuario y cambio de password
/cuenta/ordenes         → historial de órdenes paginado
/cuenta/ordenes/[id]    → detalle de una orden
```

Todas protegidas en `middleware.ts`. Si la sesión expira mientras navega,
redirigir a `/login?callbackUrl=/cuenta/...` para volver después del login.

---

## Perfil del usuario

### Datos editables
- Nombre
- Email — NO editable si el usuario se registró con Google OAuth
  (verificar si `passwordHash` es null para detectar usuarios de Google)

### Cambio de password
Solo para usuarios con credentials (no Google OAuth).
Campos: password actual, nueva password, confirmar nueva password.

**Reglas de seguridad:**
- Validar que el password actual es correcto antes de cambiar
- Nunca revelar en el error si el password actual era correcto o incorrecto
  (devolver siempre el mismo mensaje genérico para evitar enumeración)
- Nueva password: mínimo 8 caracteres
- Nunca devolver el `passwordHash` al cliente en ningún contexto

---

## Historial de órdenes

- Siempre filtrar por `userId === session.user.id`
- Paginación con cursor (10 órdenes por página)
- Mostrar: número de orden, fecha, estado (badge con color), total
- Link a detalle de cada orden

### Detalle de la orden para el cliente

```
/cuenta/ordenes/[id]
  → Verificar SIEMPRE: orders.userId === session.user.id
  → Si no coincide: notFound() (no 403, para no revelar si existe)
  → Mostrar: items, dirección, estado, número de seguimiento
  → Si status = 'pending': "Tu pago está siendo procesado"
  → Si status = 'cancelled': motivo del error de pago (desde mpDetail,
    traducido con mp-error-messages.ts)
  → Si hay trackingNumber: mostrar con link al carrier
```

---

## Prompt de esta área

### PROMPT 13 — Cuenta del cliente

```
Implementá el área de cuenta del cliente.

1. Creá app/(store)/cuenta/perfil/page.tsx:
   Server Component con los datos del usuario.
   Formulario de edición de nombre como Client Component.
   Sección de cambio de password solo visible para usuarios con credentials
   (verificar si passwordHash es null).

2. Implementá el Server Action de cambio de password:
   - Validar password actual (timing-safe, siempre bcrypt.compare)
   - Mismo mensaje de error si el password actual es incorrecto o si
     el usuario no existe — no revelar información
   - Hashear nueva password con bcrypt 12 rounds
   - Invalidar sesiones activas del usuario después del cambio

3. Creá app/(store)/cuenta/ordenes/page.tsx:
   Server Component protegido.
   Query SIEMPRE con userId === session.user.id.
   Lista paginada con badges de estado y links a detalle.

4. Creá app/(store)/cuenta/ordenes/[id]/page.tsx:
   Verificar ownership: si la orden no pertenece al usuario, notFound().
   No devolver 403 — no revelar si la orden existe.
   Mostrar detalle completo con estados y seguimiento.
   Traducir mpDetail a mensaje amigable con mp-error-messages.ts.

5. Verificar en todos los endpoints del área de cuenta que no es posible
   acceder a datos de otro usuario manipulando el ID en la URL.
```
