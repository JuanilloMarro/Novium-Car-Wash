# Novium CarWash

SaaS de gestión para car wash pequeños y medianos de Latinoamérica: órdenes por placa, cola en piso, caja con cierre ciego y control antifraude. Stack: Nuxt 4 (SPA en el panel, SSR solo en landing y página pública), Supabase con RLS, shadcn-vue + Tailwind 4, Pinia, @tanstack/vue-query, vee-validate + zod.

## Lineamientos obligatorios

Leer [docs/lineamientos.md](docs/lineamientos.md) **antes** de desarrollar cualquier cambio y volver a revisarlo **después**, pasando su lista de verificación (§15) sobre lo implementado. Si una regla no encaja, se propone una excepción y se registra en §16; nunca se rompe en silencio.

@docs/lineamientos.md

## Comandos

- `npm run dev`: servidor local
- `npm run check`: lint, tipos, pruebas unitarias y auditoría de diseño
- `npm run audit:design -- <archivos>`: revisa los archivos tocados contra los lineamientos
- `npm run build`: build de producción
- `npm run test:e2e`: Playwright (requiere `npx playwright install chromium`)
- `npm run db:types:remote`: regenera los tipos de la base después de una migración
- `npx shadcn-vue add <componente>`: única forma de agregar componentes a `app/components/ui/`
