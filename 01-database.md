# 01-database.md
# Cargar este archivo cuando trabajés en: schemas, migraciones, queries, ORM

---

## Cuándo usar este archivo

- Creando o modificando schemas de Drizzle
- Escribiendo queries a la base de datos
- Generando migraciones
- Creando seeds o scripts de importación

---

## Modelo de datos completo

### users
```typescript
id: uuid PK
email: text UNIQUE NOT NULL
name: text
image: text                        // avatar de Google OAuth
role: enum('customer', 'admin') DEFAULT 'customer'
passwordHash: text                 // null para usuarios de Google OAuth
emailVerified: timestamp
createdAt: timestamp DEFAULT now()
updatedAt: timestamp DEFAULT now()
deletedAt: timestamp               // soft delete
```

### sessions (NextAuth)
```typescript
id: uuid PK
sessionToken: text UNIQUE NOT NULL
userId: uuid FK → users.id
expires: timestamp NOT NULL
```

### products
```typescript
id: uuid PK
slug: text UNIQUE NOT NULL
name: text NOT NULL
description: text
price: integer NOT NULL            // en centavos, nunca float
compareAtPrice: integer            // precio tachado opcional
stock: integer DEFAULT 0 NOT NULL
sku: text UNIQUE
barcode: text
brand: text                        // marca del fabricante
active: boolean DEFAULT true
categoryId: uuid FK → categories.id
createdAt: timestamp DEFAULT now()
updatedAt: timestamp DEFAULT now()
deletedAt: timestamp               // soft delete
```

### categories
```typescript
id: uuid PK
slug: text UNIQUE NOT NULL
name: text NOT NULL
parentId: uuid FK → categories.id  // null = categoría raíz
order: integer DEFAULT 0
active: boolean DEFAULT true
```

### product_images
```typescript
id: uuid PK
productId: uuid FK → products.id
url: text NOT NULL
alt: text
order: integer DEFAULT 0
isPrimary: boolean DEFAULT false
```

### orders
```typescript
id: uuid PK
orderNumber: text UNIQUE NOT NULL  // legible: FE-2024-0001
userId: uuid FK → users.id         // null si es compra de invitado
guestEmail: text                   // solo para invitados
guestName: text
status: enum(
  'pending',      // creada, esperando pago
  'confirmed',    // pago aprobado
  'processing',   // el negocio prepara el pedido
  'shipped',      // despachado
  'delivered',    // entregado
  'cancelled',    // cancelado
  'refunded'      // reembolsado
) DEFAULT 'pending'
subtotal: integer NOT NULL         // en centavos
shippingCost: integer NOT NULL
total: integer NOT NULL
shippingAddress: jsonb NOT NULL    // ver tipo abajo
shippingMethod: text
shippingCarrier: text
trackingNumber: text
mpPaymentId: text
mpPreferenceId: text
mpStatus: text
mpDetail: text
createdAt: timestamp DEFAULT now()
updatedAt: timestamp DEFAULT now()
```

### Tipo ShippingAddress
```typescript
type ShippingAddress = {
  street: string
  number: string
  floor?: string
  apartment?: string
  city: string
  province: string
  postalCode: string
  country: string
}
```

### order_items
```typescript
id: uuid PK
orderId: uuid FK → orders.id
productId: uuid FK → products.id
productName: text NOT NULL         // snapshot del nombre al momento de compra
productSku: text
quantity: integer NOT NULL
unitPrice: integer NOT NULL        // snapshot del precio al momento de compra
subtotal: integer NOT NULL
```

> CRÍTICO: productName y unitPrice son snapshots. Si el dueño cambia
> el precio mañana, las órdenes anteriores conservan el precio original.
> Nunca calcular el total de una orden leyendo el precio actual del producto.

### payment_events (append-only)
```typescript
id: uuid PK
orderId: uuid FK → orders.id
mpPaymentId: text
mpExternalReference: text
event: text                        // nombre del evento de MP
payload: jsonb NOT NULL            // body completo del webhook
receivedAt: timestamp DEFAULT now()
```

> APPEND-ONLY: nunca editar ni borrar registros de esta tabla.
> Es el log de auditoría de todos los eventos de pago.

### shipping_quotes
```typescript
id: uuid PK
orderId: uuid FK → orders.id
carrier: text NOT NULL             // 'andreani' | 'correo-argentino'
service: text NOT NULL
price: integer NOT NULL
estimatedDays: integer
expiresAt: timestamp NOT NULL      // 30 minutos desde la cotización
selected: boolean DEFAULT false
```

### carts
```typescript
id: uuid PK
userId: uuid FK → users.id UNIQUE
createdAt: timestamp DEFAULT now()
updatedAt: timestamp DEFAULT now()
```

### cart_items
```typescript
id: uuid PK
cartId: uuid FK → carts.id
productId: uuid FK → products.id
quantity: integer NOT NULL
addedAt: timestamp DEFAULT now()
```

### pages
```typescript
id: uuid PK
slug: text UNIQUE NOT NULL
title: text NOT NULL
content: jsonb                     // Lexical editor de Payload
metaTitle: text
metaDescription: text
updatedAt: timestamp DEFAULT now()
```

### banners
```typescript
id: uuid PK
title: text NOT NULL
imageUrl: text NOT NULL
linkUrl: text
order: integer DEFAULT 0
active: boolean DEFAULT true
startsAt: timestamp
endsAt: timestamp
```

### mail_logs (idempotencia de mails)
```typescript
id: uuid PK
idempotencyKey: text UNIQUE NOT NULL  // orderId + templateName
to: text NOT NULL
template: text NOT NULL
sentAt: timestamp DEFAULT now()
```

---

## Reglas de base de datos

- Todos los IDs son UUIDs generados con `crypto.randomUUID()`
- Los campos de dinero son `integer` en centavos — nunca `float` o `decimal`
- `updatedAt` se actualiza automáticamente con un hook de Drizzle en cada mutación
- Soft deletes en `users` y `products` con `deletedAt` — nunca borrar físicamente
- Row Level Security (RLS) activo en Neon
- Todas las migraciones versionadas en `lib/db/migrations/`
- Nunca cambios manuales en producción — solo migraciones

---

## Queries — reglas

- Todas las queries tipadas, exportadas desde `lib/db/queries/[entidad].ts`
- Las queries de productos siempre filtran `active = true AND deletedAt IS NULL`
- Las queries de órdenes siempre filtran por `userId` — nunca devolver órdenes de otros
- Paginar con cursor (no con offset) para listas grandes

---

## Prompts de esta área

### PROMPT 01 — Schemas y migraciones

```
Implementá todos los schemas de Drizzle ORM según el modelo de datos
definido en 01-database.md.

Cada tabla va en su propio archivo en lib/db/schemas/.
Exportá todos los schemas desde lib/db/schemas/index.ts.
Exportá todos los tipos inferidos (InferSelectModel, InferInsertModel)
desde lib/db/types.ts.

Reglas:
- IDs: uuid con crypto.randomUUID()
- Dinero: integer en centavos, con comentario explicativo en el schema
- updatedAt: hook de Drizzle que lo actualiza automáticamente
- Enum de status de orders con los 7 estados definidos
- shippingAddress en orders como jsonb tipado con el tipo ShippingAddress
- payment_events sin updatedAt — es append-only por diseño

Creá también:
- lib/db/index.ts: cliente Neon configurado para Vercel serverless
- drizzle.config.ts: apuntando a DATABASE_URL
- Ejecutá: npx drizzle-kit generate para crear la migración inicial

Al terminar: npx drizzle-kit generate debe correr sin errores.
```

### PROMPT 02 — Queries base

```
Creá las queries de base de datos para el catálogo en lib/db/queries/.

products.ts:
- getProducts({ categorySlug?, search?, page?, limit? })
  Búsqueda fuzzy con pg_trgm. Paginación con cursor.
  Siempre filtra active = true AND deletedAt IS NULL.
- getProductBySlug(slug): con imágenes y categoría. Null si no existe.
- getFeaturedProducts(limit): más recientes activos.
- decrementStock(productId, quantity): dentro de una transacción.
  Si llega a 0, setear active = false automáticamente.

categories.ts:
- getCategories(): árbol completo de categorías activas ordenado.
- getCategoryBySlug(slug): con sus hijos directos.

orders.ts:
- getOrderById(orderId, userId): verifica ownership. Null si no es del usuario.
- getOrdersByUser(userId, page?): historial paginado.
- createOrder(data): crea orden en 'pending' con su orderNumber legible.
- updateOrderStatus(orderId, status, extra?): con validación de transiciones.

cart.ts:
- getCart(userId): con items y datos actuales del producto.
- addToCart(userId, productId, quantity)
- updateCartItem(userId, itemId, quantity)
- removeCartItem(userId, itemId)
- clearCart(userId)
- mergeAnonymousCart(userId, items): merge del carrito anónimo al loguearse.

Todas las funciones retornan tipos explícitos inferidos desde lib/db/types.ts.
Ninguna función devuelve campos sensibles como passwordHash o deletedAt.
```
