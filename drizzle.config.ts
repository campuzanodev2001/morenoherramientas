import { defineConfig } from 'drizzle-kit'

// drizzle-kit no carga .env automáticamente: ejecutar con
//   node --env-file=.env.local node_modules/.bin/drizzle-kit <cmd>
// o tener DATABASE_URL en el entorno.
export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schemas/index.ts',
  out: './lib/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/postgres',
  },
  casing: 'snake_case',
  verbose: true,
  strict: true,
})
