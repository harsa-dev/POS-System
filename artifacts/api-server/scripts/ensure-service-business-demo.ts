import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

loadEnvFile();

const { prisma } = await import("../src/lib/prisma.js");

const DEMO_SERVICE_BUSINESS_NAME = "Service Demo Business";
const DEMO_SERVICE_BUSINESS_ID_PREFIX = "service-demo-business";

async function findDemoOwner() {
  return prisma.user.findFirst({
    where: {
      isActive: true,
      role: {
        in: ["OWNER", "ADMIN", "MANAGER"],
      },
    },
    orderBy: [
      { role: "asc" },
      { createdAt: "asc" },
    ],
  });
}

async function ensureServiceBusinessDemo() {
  const existingServiceBusiness = await prisma.business.findFirst({
    where: {
      mode: "SERVICE",
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existingServiceBusiness) {
    console.log(
      `Active SERVICE business already exists: ${existingServiceBusiness.name} (${existingServiceBusiness.id}).`,
    );
    return existingServiceBusiness;
  }

  const owner = await findDemoOwner();

  if (!owner) {
    console.log("No active OWNER/ADMIN/MANAGER user found. Cannot create Service demo business.");
    console.log("Create a user first, then rerun: pnpm --filter @workspace/api-server run service:ensure-business");
    return null;
  }

  const businessId = `${DEMO_SERVICE_BUSINESS_ID_PREFIX}-${owner.id}`;

  const business = await prisma.business.upsert({
    where: {
      id: businessId,
    },
    create: {
      id: businessId,
      name: DEMO_SERVICE_BUSINESS_NAME,
      type: "SERVICE",
      mode: "SERVICE",
      ownerId: owner.id,
      isActive: true,
    },
    update: {
      name: DEMO_SERVICE_BUSINESS_NAME,
      type: "SERVICE",
      mode: "SERVICE",
      ownerId: owner.id,
      isActive: true,
    },
  });

  console.log(`Created/updated SERVICE demo business: ${business.name} (${business.id}).`);
  console.log(`Owner: ${owner.name} <${owner.email}> (${owner.id}).`);
  console.log("Next: pnpm --filter @workspace/api-server run service:seed");

  return business;
}

try {
  await ensureServiceBusinessDemo();
} finally {
  await prisma.$disconnect();
}
