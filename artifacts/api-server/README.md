# API Server

Express + Prisma API server for the Enterprise POS System.

## Setup (after fresh install)

```bash
# From the workspace root — installs all workspace dependencies
pnpm install

# Generate the Prisma client (required before first run)
pnpm --filter @workspace/api-server run generate
```

> `pnpm run build` already calls `generate` automatically, so a manual
> `generate` is only needed if you want to regenerate without a full build.

## Scripts

| Script | What it does |
|--------|--------------|
| `pnpm run dev` | Generate → build → start (development) |
| `pnpm run generate` | Generate Prisma client only |
| `pnpm run build` | Generate Prisma client, then bundle with esbuild |
| `pnpm run start` | Start the compiled server |
| `pnpm run typecheck` | Type-check without emitting |

## Database schema changes

Schema changes are intentionally **manual** to prevent accidental data loss:

```bash
# Edit prisma/schema.prisma, then:
pnpm --filter @workspace/api-server exec prisma migrate dev --name <description>

# To push schema changes without a migration file (dev only):
pnpm --filter @workspace/api-server exec prisma db push
```

Never run `prisma migrate deploy` or `prisma db push` automatically on startup.
