# 04-cart-checkout.md
# Cargar este archivo cuando trabajés en: carrito, checkout, pagos, envíos, webhooks

---

## Cuándo usar este archivo

- Implementando el carrito de compras
- Creando el flujo de checkout
- Integrando MercadoPago Bricks
- Configurando cotización de envíos
- Implementando el webhook de MP

---

## Carrito — arquitectura

### Usuarios no logueados
- Carrito en `localStorage` con estructura:
  ```typescript
  type AnonymousCart = {
    items: { productId: string, quantity: number, addedAt: string }[]
    updatedAt: string
  }
  ```
- Cookie de sesión anónima con UUID para identificar el carrito

### Usuarios logueados
- Carrito en DB (tablas `carts` + `cart_items`)
- Mutaciones via Server Actions
- Lectura via SWR para reactividad

### Merge al loguearse
Al hacer login, en el callback `signIn` de NextAuth:
- Si hay un carrito anónimo en la cookie, leer sus items
- Mergear con el carrito del usuario en DB sumando cantidades duplicadas
- Limpiar la cookie de sesión anónima

### Reglas de negocio del carrito
- No agregar más unidades que el stock disponible
- Si el stock cambió desde que se agregó el item, mostrar advertencia con stock actual
- El carrito de un usuario no es accesible para otro usuario (verificar ownership en cada Server Action)

---

## Checkout — flujo completo

```
Paso 1: Datos del comprador
  → nombre, email, teléfono
  → si logueado: prellenar con sus datos

Paso 2: Dirección de envío
  → calle, número, piso/depto (opcional), ciudad, provincia, CP
  → CP dispara la cotización de envío

Paso 3: Selección de método de envío
  → cotización en tiempo real de Andreani y Correo Argentino
  → opciones ordenadas por precio
  → expiración de 30 minutos

Paso 4: Pago con MercadoPago Bricks
  → preferencia creada en el servidor
  → Brick renderizado con preferenceId
```

### Estado del checkout
- Persistir en `sessionStorage` para sobrevivir recargas
- Hook `useCheckoutState` que lee/escribe en sessionStorage
- Limpiar al completar la compra

---

## MercadoPago — integración

### Tipo de integración
**Checkout Bricks** — embebido en la tienda.
No redirigir al usuario a la página de MP.

### Medios de pago habilitados
- Tarjeta de crédito y débito
- Cuenta MercadoPago
- Cuotas sin tarjeta
- Rapipago y Pago Fácil

### Configuración de la preferencia (crítico)
```typescript
{
  items: [{ title, unit_price, quantity }],  // precios calculados en servidor
  payer: { email },
  back_urls: {
    success: APP_URL + '/orden/' + orderId,
    failure: APP_URL + '/orden/' + orderId,
    pending: APP_URL + '/orden/' + orderId,
  },
  notification_url: APP_URL + '/api/webhooks/mercadopago',
  external_reference: orderId,              // para identificar la orden interna
  expires: true,
  expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  statement_descriptor: 'FERRETERIA',
}
```

### Flujo del pago en el servidor

```
POST /api/checkout/create-preference
  1. Rate limiting CHECKOUT
  2. Validar body con Zod
  3. Leer carrito desde DB (o localStorage en invitado)
  4. Verificar que el carrito no está vacío
  5. Recalcular TODOS los precios desde la DB         ← nunca del cliente
  6. Verificar stock de cada item
     → Si alguno falla: devolver error con qué productos sin stock
  7. Verificar que la cotización de envío no expiró
  8. Calcular total = items + envío (todo desde servidor)
  9. Crear orden en DB con status 'pending'
  10. Llamar a MP API → obtener preferenceId
  11. Guardar mpPreferenceId en la orden
  12. Devolver { preferenceId, orderId, total }
```

> Si cualquier paso falla, la orden NO se crea.

---

## Webhook de MercadoPago — flujo crítico

> Este es el único lugar donde se confirma una orden y se descuenta stock.

```
POST /api/webhooks/mercadopago
  1. Validar firma x-signature    → 401 si inválida (única respuesta no-200)
  2. Parsear body con Zod
  3. Filtrar: solo procesar type === 'payment'
  4. Guardar en payment_events    → APPEND-ONLY, antes de cualquier lógica
  5. Verificar idempotencia       → si ya procesé este paymentId, devolver 200
  6. Consultar el pago en MP API  → no confiar en el status del webhook
  7. Obtener la orden por external_reference
  
  Si status === 'approved':
    a. Iniciar transacción de DB
    b. Actualizar orden a 'confirmed', guardar mpPaymentId
    c. Decrementar stock de cada order_item
       → Si stock llega a 0: active = false + revalidatePath
    d. Limpiar carrito del usuario
    e. Commitear transacción
    f. Disparar mail (fire-and-forget, fuera de la transacción)
  
  Si status === 'rejected':
    a. Actualizar orden a 'cancelled'
    b. Guardar mpDetail para mostrar al usuario
  
  Si status === 'pending' / 'in_process':
    a. Mantener en 'pending', no hacer nada más
  
  SIEMPRE devolver 200 al final
  → Si devolvemos 4xx/5xx, MP reintenta hasta 5 veces
  → Loggear errores internamente pero responder 200
  
  Timeout máximo: 10 segundos
```

### Cron job de limpieza
- Ruta: `GET /api/cron/cancelar-ordenes-pendientes`
- Autenticación: header `Authorization: Bearer CRON_SECRET`
- Cancela órdenes en `pending` con más de 30 minutos de antigüedad
- Configurar en `vercel.json`: cada 5 minutos

---

## Envíos — cotización

```typescript
// lib/shipping/index.ts
quoteShipping(postalCode: string, items: CartItem[])
  → Llama en paralelo a Andreani y Correo Argentino con Promise.all
  → Si una API falla, devuelve la otra (no fallar todo por una)
  → Si las dos fallan, lanza ShippingError
  → Guarda cotizaciones en shipping_quotes con expiresAt = 30min
  → Devuelve { carrier, service, price, estimatedDays }[]
```

### Validación del CP
- Formato argentino: exactamente 4 dígitos numéricos
- Validar con Zod antes de llamar a las APIs
- Las credenciales de Andreani y Correo Argentino solo en env del servidor

---

## Página de resultado de la orden

`app/(store)/orden/[id]/page.tsx`

- MP redirige acá como `back_url` con query params de estado
- Leer siempre el estado real de la DB (no confiar en el query param de MP)
- Verificar que la orden pertenece al usuario o al guestEmail
- Mostrar según el estado real de la orden:
  - `confirmed`: resumen completo, próximos pasos
  - `pending`: "tu pago está siendo procesado, te avisamos por mail"
  - `cancelled`: mensaje del error de pago + opción de reintentar
- Después de un pago exitoso: limpiar sessionStorage del checkout
- Usar `replaceState` para que el botón "atrás" no vuelva al checkout

---

## Prompts de esta área

### PROMPT 08 — Carrito

```
Implementá el carrito de compras según las especificaciones de 04-cart-checkout.md.

1. Creá lib/cart/anonymous-cart.ts con helpers para leer/escribir/mergear
   el carrito anónimo en localStorage.

2. Creá el CartContext en components/cart/CartContext.tsx:
   - Detecta estado de sesión (logueado / anónimo)
   - Si logueado: Server Actions + SWR
   - Si anónimo: localStorage
   - Expone: items, total, count, addItem, removeItem, updateQuantity, clear
   - Loading y error state por operación individual (no global)

3. Creá lib/cart/actions.ts con Server Actions:
   - addToCart, updateCartItem, removeCartItem, clearCart
   - Todas validan sesión, ownership y usan Zod
   - Devuelven { success: true } o { success: false, error: string }
   - Llaman revalidatePath('/carrito') al mutar

4. Creá app/(store)/carrito/page.tsx:
   - Carga inicial como Server Component
   - Items como Client Component con feedback inmediato por operación
   - Advertencia si el stock de algún item cambió
   - Botón "Ir al checkout" deshabilitado con carrito vacío

5. Creá el CartDrawer en el header:
   - Se abre al agregar un producto
   - Contador actualizado optimistamente
   - Slide-in desde la derecha
```

### PROMPT 09 — Checkout: formulario y envíos

```
Implementá el checkout hasta la pantalla de pago (sin incluir el Brick de MP).

1. Creá app/(store)/checkout/page.tsx:
   Redirigir si el carrito está vacío.
   Layout dos columnas: formulario izquierda, resumen sticky derecha.

2. Implementá CheckoutForm con validación Zod inline:
   - Datos del comprador (nombre, email, teléfono)
   - Prellenar si está logueado
   - Error por campo en tiempo real al perder el foco

3. Implementá ShippingAddressForm:
   - Campos de dirección argentina
   - Validar CP: exactamente 4 dígitos
   - Al ingresar CP válido, disparar cotización de envío

4. Creá app/api/envios/cotizar/route.ts:
   - POST con rate limiting API_PUBLIC
   - Validar CP con Zod
   - Recalcular total de items desde DB (nunca del cliente)
   - Llamar en paralelo a Andreani y Correo Argentino
   - Guardar en shipping_quotes con expiración 30min
   - Devolver opciones ordenadas por precio

5. Implementá ShippingSelector:
   - Skeleton mientras cotiza
   - Timeout de 10s con mensaje de error y botón reintentar
   - Al seleccionar, actualizar total del resumen en tiempo real

6. Creá el hook useCheckoutState que persiste en sessionStorage.
   Todos los campos del formulario deben sobrevivir una recarga.
```

### PROMPT 10 — Checkout: MercadoPago Bricks

```
Implementá la integración de MercadoPago Bricks y el webhook.

1. Creá lib/payments/mercadopago.ts:
   - createPreference(order): con la configuración exacta de 04-cart-checkout.md
   - getPayment(paymentId): consulta estado en MP
   - validateWebhookSignature(headers, body): valida x-signature

2. Creá app/api/checkout/create-preference/route.ts con el flujo
   completo de 12 pasos definido en 04-cart-checkout.md.
   Cada paso debe fallar con el error correcto si algo sale mal.
   Si cualquier paso falla antes del paso 9, la orden NO se crea.

3. Creá components/checkout/PaymentBricks.tsx (Client Component):
   - Skeleton del tamaño del formulario mientras el Brick carga
   - Inicializar con NEXT_PUBLIC_MP_PUBLIC_KEY
   - onError: mapear códigos de MP a mensajes humanos
   - Estado de loading en el botón mientras MP procesa

4. Implementá app/api/webhooks/mercadopago/route.ts con el flujo
   COMPLETO y en orden exacto definido en 04-cart-checkout.md.
   CRÍTICO: validar firma ANTES de cualquier otra operación.
   CRÍTICO: siempre responder 200 al final (excepto firma inválida).

5. Creá app/api/cron/cancelar-ordenes-pendientes/route.ts:
   Solo acepta requests con Authorization: Bearer CRON_SECRET.
   Cancela órdenes pending con más de 30 minutos.

6. Creá app/(store)/orden/[id]/page.tsx con el comportamiento
   definido en 04-cart-checkout.md. Siempre leer estado de la DB.

7. Creá vercel.json con el cron job configurado para cada 5 minutos.
```
