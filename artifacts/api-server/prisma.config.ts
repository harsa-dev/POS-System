import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function readDatabaseUrlFromEnvFile() {
  const envPath = path.join(import.meta.dirname, ".env");

  if (!fs.existsSync(envPath)) {
    return undefined;
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/^DATABASE_URL=(.*)$/m);

  if (!match) {
    return undefined;
  }

  return match[1]?.trim().replace(/^['"]|['"]$/g, "");
}

const connectionString = process.env.DATABASE_URL ?? readDatabaseUrlFromEnvFile();

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
