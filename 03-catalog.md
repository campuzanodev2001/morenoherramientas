# 03-catalog.md
# Cargar este archivo cuando trabajés en: catálogo, búsqueda, páginas de productos, panel admin de productos

---

## Cuándo usar este archivo

- Creando páginas del catálogo (home, categoría, ficha de producto)
- Implementando búsqueda y filtros
- Construyendo el panel admin de productos, categorías y banners
- Trabajando con ISR y caché de páginas
- Implementando uploads a Cloudinary

---

## Catálogo — estrategia de rendering

| Página | Estrategia | Revalidación |
|---|---|---|
| Home | ISR | 5 minutos |
| Categoría | ISR + generateStaticParams | 5 minutos |
| Producto | ISR + generateStaticParams | 5 minutos |
| Búsqueda | Dinámico (searchParams) | Sin caché |

### generateStaticParams
- Categorías: pre-renderizar todas las categorías activas de primer nivel
- Productos: pre-renderizar los primeros 200 productos más recientes

### Búsqueda
- Motor: `pg_trgm` (extensión de PostgreSQL, sin costo extra)
- Endpoint: `GET /api/productos/buscar?q=&categoria=&precioMin=&precioMax=&page=`
- Rate limiting: `RATE_LIMITS.SEARCH`
- Paginación con cursor, no con offset

### URLs
- Nunca exponer IDs internos de DB en URLs
- Solo slugs: `/producto/llave-inglesa-24`, `/categoria/herramientas-electricas`

---

## Cloudinary — uploads desde el panel admin

### Flujo de upload seguro

```
1. Admin selecciona imagen en el formulario
2. POST /api/admin/cloudinary/sign
   → requireRole('admin')
   → Genera una firma con CLOUDINARY_API_SECRET (server only)
   → Devuelve { signature, timestamp, cloudName, apiKey }
3. Cliente sube directamente a Cloudinary con la firma
4. Cloudinary devuelve { public_id, secure_url, width, height }
5. Se guarda secure_url en la DB
```

Nunca exponer CLOUDINARY_API_SECRET al cliente.
El upload siempre va firmado desde el servidor.

### Transformaciones por URL

```typescript
// lib/cloudinary/transforms.ts
export const transforms = {
  thumbnail: 'w_80,h_80,c_fill,q_auto,f_auto',
  card:      'w_400,h_400,c_fit,q_auto,f_auto',
  gallery:   'w_800,h_800,c_fit,q_auto,f_auto',
  zoom:      'w_1200,h_1200,c_fit,q_auto,f_auto',
}

export function cloudinaryUrl(publicId: string, transform: keyof typeof transforms) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms[transform]}/${publicId}`
}
```

---

## Panel admin — productos

### /admin/productos
- Listado paginado con búsqueda por nombre o SKU
- Filtro por categoría y por estado (activo/inactivo)
- Columnas: imagen thumbnail, nombre, SKU, precio, stock, estado, acciones
- Botón "Nuevo producto" → /admin/productos/nuevo
- Desactivar producto desde el listado sin entrar al formulario (toggle)

### /admin/productos/[id] y /admin/productos/nuevo
Formulario con estos campos:
- Nombre (genera el slug automáticamente, editable)
- SKU y código de barras
- Marca (brand)
- Categoría (selector con árbol)
- Precio en pesos (integer, sin decimales)
- Precio comparativo tachado (opcional)
- Stock (integer)
- Descripción (textarea)
- Especificaciones técnicas (tabla dinámica key/value — agregar filas)
- Imágenes (upload múltiple a Cloudinary, reordenables, marcar imagen principal)
- Estado activo/inactivo

Reglas del formulario:
- Si stock llega a 0 al guardar, forzar active = false con advertencia visible
- Slug se genera automáticamente con slugify pero es editable
- Si el slug ya existe, agregar el SKU al final automáticamente
- Al guardar: llamar revalidatePath para invalidar caché del producto y su categoría
- Validación Zod en cliente (feedback inmediato) y en servidor (fuente de verdad)

### /admin/categorias
- Vista de árbol con hasta 2 niveles de profundidad
- Crear, editar y reordenar categorías
- No borrar categorías que tengan productos asignados — mostrar error claro

### /admin/banners
- Listado de banners con preview de imagen
- Campos: título, imagen (Cloudinary), link destino, orden, activo, startsAt, endsAt
- Preview de cómo se ve el banner antes de guardar

---

## Componentes del catálogo

### Estados de loading obligatorios
Todos los componentes del catálogo deben tener su versión Skeleton:
- `ProductCardSkeleton`
- `ProductGridSkeleton`
- `ProductRowSkeleton`
- `CategoryGridSkeleton`
- `SearchBarSkeleton`

Usar `<Suspense fallback={<Skeleton />}>` en cada boundary.

### SEO en páginas de producto
```typescript
export async function generateMetadata({ params }) {
  const product = await getProductBySlug(params.slug)
  return {
    title: product.name + ' — Moreno Herramientas',
    description: product.description?.slice(0, 160),
    openGraph: {
      images: [{ url: cloudinaryUrl(product.images[0]?.publicId, 'gallery') }]
    }
  }
}
```

### Structured data en ficha de producto
```json
{
  "@type": "Product",
  "name": "...",
  "brand": { "@type": "Brand", "name": "..." },
  "sku": "...",
  "offers": {
    "@type": "Offer",
    "price": "...",
    "priceCurrency": "ARS",
    "availability": "InStock | OutOfStock"
  }
}
```

---

## Prompts de esta área

### PROMPT 06 — Panel admin: productos, categorías y banners

```
Implementá el panel admin de gestión de contenido en /admin.
No hay CMS de terceros — todo son rutas Next.js propias protegidas
con requireRole('admin').

1. Creá app/admin/page.tsx (Dashboard):
   Métricas del día: órdenes nuevas, ingresos, productos sin stock.
   Accesos directos a cada sección del admin.
   Server Component con revalidación cada 60 segundos.

2. Creá app/admin/productos/page.tsx:
   Listado paginado con búsqueda, filtro por categoría y estado.
   Toggle de activo/inactivo inline sin entrar al formulario.
   Server Component.

3. Creá app/admin/productos/[id]/page.tsx y
   app/admin/productos/nuevo/page.tsx:
   Formulario completo según las especificaciones de 03-catalog.md.
   Upload de imágenes a Cloudinary con el flujo firmado desde servidor.
   Tabla dinámica de especificaciones técnicas (agregar/quitar filas).
   Imágenes reordenables con drag and drop.
   Validación Zod inline + validación en Server Action.

4. Creá app/api/admin/cloudinary/sign/route.ts:
   POST protegido con requireRole('admin').
   Genera firma con CLOUDINARY_API_SECRET para upload directo.
   Devuelve { signature, timestamp, cloudName, apiKey }.
   Nunca exponer el API secret al cliente.

5. Creá app/admin/categorias/page.tsx:
   Vista de árbol con hasta 2 niveles.
   Crear, editar y reordenar. No borrar si tiene productos.

6. Creá app/admin/banners/page.tsx:
   CRUD completo con preview de imagen y campos de scheduling.

7. Al guardar cualquier producto o categoría, llamar revalidatePath
   para invalidar el caché ISR de las páginas afectadas.

8. Todos los formularios del admin tienen:
   - Loading state en el botón de submit
   - Feedback de éxito con mensaje claro
   - Feedback de error con mensaje específico por campo
   - Confirmación modal antes de desactivar o borrar
```

### PROMPT 07 — Catálogo público

```
Implementá el catálogo de productos completo para los clientes.

1. Creá app/(store)/page.tsx (Home):
   Server Component con ISR revalidate: 300.
   Banners activos filtrados por startsAt/endsAt.
   Productos destacados (más recientes activos).

2. Creá app/(store)/categoria/[slug]/page.tsx:
   Server Component con ISR revalidate: 300.
   generateStaticParams para categorías de primer nivel.
   Listado con filtros de subcategorías y precio.
   Paginación con searchParams.
   notFound() si la categoría no existe o está inactiva.

3. Creá app/(store)/producto/[slug]/page.tsx:
   Server Component con ISR revalidate: 300.
   generateStaticParams para los primeros 200 productos.
   generateMetadata para SEO dinámico.
   Structured data Product con precio y disponibilidad.
   Galería de imágenes con Cloudinary transforms.
   Tabla de especificaciones técnicas.
   Botón WhatsApp con nombre del producto pre-cargado.
   Productos relacionados de la misma categoría.
   notFound() si el producto no existe, está inactivo o tiene deletedAt.

4. Creá app/api/productos/buscar/route.ts:
   GET con rate limiting SEARCH.
   Validar todos los params con Zod.
   Búsqueda fuzzy con pg_trgm.
   Devolver { products, total, nextCursor }.

5. Creá todos los Skeleton components.
   loading.tsx y error.tsx en cada segmento de ruta.
```
