import path from "node:path";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

export default defineConfig({
  earlyAccess: true,
  schema: path.join(import.meta.dirname, "prisma/schema.prisma"),
  datasource: {
    url: connectionString ?? "",
  },
  migrate: {
    async adapter() {
      const pool = new pg.Pool({ connectionString });
      return new PrismaPg(pool);
    },
  },
});
