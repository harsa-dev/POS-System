---
name: Prisma migrate dev shadow DB failure
description: Why prisma migrate dev fails and how to apply migrations manually in this project.
---

## Rule
`prisma migrate dev` fails with "Migration X failed to apply cleanly to shadow database" because migration `20260610000000_add_invoice_module` references a `Restaurant` table that does not exist in the shadow DB (it was dropped in an earlier migration that the shadow DB replays from scratch).

**Why:** Shadow DB replays all migrations from the beginning. The `Restaurant` table migration and the invoice module migration are not in the correct order for a clean replay.

## How to apply
1. Write the migration SQL manually: `prisma/migrations/<timestamp>_<name>/migration.sql`
2. Apply it directly to the real DB via the pg driver:
   ```js
   const { Client } = await import('pg');
   const client = new Client({ connectionString: process.env.DATABASE_URL });
   await client.connect();
   await client.query(/* migration SQL */);
   await client.end();
   ```
3. Mark as applied: `pnpm exec prisma migrate resolve --applied <migration_name>`
4. Run `pnpm exec prisma generate` to update the Prisma client.

## Decimal column type
For Prisma `Decimal?` fields, use `DECIMAL(65,30)` in raw SQL (matches Prisma's internal Decimal type).
