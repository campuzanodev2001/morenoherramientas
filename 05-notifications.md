# 05-notifications.md
# Cargar este archivo cuando trabajés en: mails transaccionales, templates de email

---

## Cuándo usar este archivo

- Implementando el sistema de mails
- Creando templates de React Email
- Configurando Resend
- Conectando mails a eventos del sistema

---

## Arquitectura de mails

### Proveedor
Resend con React Email para los templates.

### Idempotencia — crítico
Cada mail tiene un `idempotencyKey = orderId + ':' + templateName`.
Antes de enviar, verificar en `mail_logs` si ya se envió.
Si ya existe, no enviar de nuevo.
Esto previene duplicados cuando el webhook de MP llega más de una vez.

```typescript
// lib/mail/index.ts
async function sendMail({ to, subject, template, props, idempotencyKey }) {
  // 1. Verificar en mail_logs si ya se envió
  // 2. Si ya existe, return { skipped: true }
  // 3. Si no, enviar con Resend
  // 4. Guardar en mail_logs
  // 5. En desarrollo: loggear HTML a console, no enviar
}
```

### Manejo de errores
Los mails se disparan con `fire-and-forget` — un fallo de mail no debe
romper el flujo principal (no usar `await` en el webhook).
Loggear el error internamente pero no propagarlo.

---

## Templates requeridos

### OrderConfirmation
**Trigger**: webhook MP con status `approved`
**Datos**: número de orden, items con miniaturas, total, dirección de envío, carrier estimado
**CTA**: "Ver mi orden" → `APP_URL/orden/[id]`

### OrderShipped
**Trigger**: admin marca la orden como `shipped`
**Datos**: número de orden, número de seguimiento, carrier
**CTA**: "Rastrear mi envío" → link de seguimiento del carrier

### OrderDelivered
**Trigger**: admin marca la orden como `delivered`
**Datos**: número de orden, resumen
**CTA**: "Ver mis compras" → `APP_URL/cuenta/ordenes`

### PaymentFailed
**Trigger**: webhook MP con status `rejected`
**Datos**: motivo del rechazo (desde `mpDetail`, traducido con `mp-error-messages.ts`)
**CTA**: "Reintentar el pago" → `APP_URL/checkout` (con la orden para reintentar)
**Tono**: claro, no alarmista. Nunca culpar al usuario.

### WelcomeEmail
**Trigger**: primer login de un nuevo usuario (callback `signIn` de NextAuth)
**Datos**: nombre del usuario
**CTA**: "Explorar la tienda" → `APP_URL`

---

## Dispatch functions en lib/mail/dispatch.ts

```typescript
// Cada función lee los datos necesarios de la DB antes de enviar
sendOrderConfirmation(orderId: string): Promise<void>
sendOrderShipped(orderId: string, trackingNumber: string): Promise<void>
sendOrderDelivered(orderId: string): Promise<void>
sendPaymentFailed(orderId: string): Promise<void>
sendWelcomeEmail(userId: string): Promise<void>
```

---

## Dónde se hookean los mails

| Mail | Disparado desde |
|---|---|
| OrderConfirmation | `api/webhooks/mercadopago` cuando `status = approved` |
| PaymentFailed | `api/webhooks/mercadopago` cuando `status = rejected` |
| WelcomeEmail | Callback `signIn` de NextAuth, solo si `isNewUser = true` |
| OrderShipped | Server Action del panel admin al cambiar estado |
| OrderDelivered | Server Action del panel admin al cambiar estado |

---

## Prompt de esta área

### PROMPT 11 — Mails transaccionales

```
Implementá el sistema de mails con Resend y React Email.

1. Creá lib/mail/index.ts con la función sendMail() que implementa
   idempotencia usando mail_logs. En desarrollo: loggear HTML a
   console, no enviar a Resend.

2. Creá los 5 templates en lib/mail/templates/ usando React Email:
   OrderConfirmation, OrderShipped, OrderDelivered, PaymentFailed, WelcomeEmail.
   
   Todos los templates deben:
   - Incluir el logo desde StoreSettings
   - Ser responsive
   - Tener un CTA claro como botón
   - Los precios formateados en ARS con separadores de miles

3. Creá lib/mail/dispatch.ts con las 5 funciones dispatch tipadas.
   Cada función lee los datos necesarios de la DB antes de enviar.
   Los errores se loggean internamente — nunca propagar.

4. Hookeá los mails según la tabla de 05-notifications.md:
   - En el webhook de MP (fire-and-forget, sin await)
   - En el callback signIn de NextAuth (solo isNewUser = true)
   - En los Server Actions del panel admin (PROMPT 12)

5. Verificar idempotencia: simular que el webhook de MP llega dos veces
   con el mismo paymentId. El mail de confirmación debe enviarse solo una vez.
```
