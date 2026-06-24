# Índice — Archivos de contexto para Claude Code

Copiá todos estos archivos a la carpeta `/docs/claude/` en la raíz del proyecto.
`CLAUDE.md` va en la raíz del proyecto (no dentro de docs/).

---

## Cómo usar

`CLAUDE.md` está siempre activo — Claude Code lo lee automáticamente.
Los otros archivos los cargás con `@docs/claude/[archivo]` cuando arrancás
a trabajar en esa área.

---

## Mapa de archivos → prompts

| Archivo | Cuándo cargarlo | Prompts que contiene |
|---|---|---|
| `CLAUDE.md` | Siempre (raíz del proyecto) | Stack, estructura, reglas globales |
| `01-database.md` | Schemas, queries, migraciones | PROMPT 01 — Schemas, PROMPT 02 — Queries |
| `02-security.md` | Auth, rate limiting, errores, APIs | PROMPT 03 — Errores, PROMPT 04 — Rate limiting, PROMPT 05 — Auth |
| `03-catalog.md` | Payload CMS, catálogo, búsqueda | PROMPT 06 — Payload, PROMPT 07 — Catálogo |
| `04-cart-checkout.md` | Carrito, checkout, MP, envíos, webhook | PROMPT 08 — Carrito, PROMPT 09 — Checkout, PROMPT 10 — MP + Webhook |
| `05-notifications.md` | Mails transaccionales | PROMPT 11 — Mails |
| `06-admin.md` | Panel de órdenes del admin | PROMPT 12 — Admin |
| `07-account.md` | Cuenta del cliente | PROMPT 13 — Cuenta |
| `08-launch.md` | Deploy, importación, SEO, hardening | PROMPT 14 — Importación + SEO |

---

## Orden de ejecución

```
1.  @docs/claude/01-database.md    → PROMPT 01 (schemas)
2.  @docs/claude/01-database.md    → PROMPT 02 (queries)
3.  @docs/claude/02-security.md    → PROMPT 03 (errores)
4.  @docs/claude/02-security.md    → PROMPT 04 (rate limiting)
5.  @docs/claude/02-security.md    → PROMPT 05 (auth)
6.  @docs/claude/03-catalog.md     → PROMPT 06 (Payload CMS)
7.  @docs/claude/03-catalog.md     → PROMPT 07 (catálogo)
8.  @docs/claude/04-cart-checkout.md → PROMPT 08 (carrito)
9.  @docs/claude/04-cart-checkout.md → PROMPT 09 (checkout formulario)
10. @docs/claude/04-cart-checkout.md → PROMPT 10 (MP + webhook) ← crítico
11. @docs/claude/05-notifications.md → PROMPT 11 (mails)
12. @docs/claude/06-admin.md       → PROMPT 12 (admin)
13. @docs/claude/07-account.md     → PROMPT 13 (cuenta)
14. @docs/claude/08-launch.md      → PROMPT 14 (importación + SEO + deploy)
```

---

## Regla de oro

Antes de avanzar al siguiente prompt:
1. El código compila sin errores de TypeScript
2. No hay `any` nuevo introducido
3. El flujo principal del área funciona en local
4. Los errores se muestran correctamente al usuario

---

## Nota sobre el PROMPT 10

El webhook de MercadoPago es el más crítico del proyecto.
Después de que Claude Code lo implemente, revisalo línea por línea antes de continuar.
Es el único lugar donde se mueve dinero real.
