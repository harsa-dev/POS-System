import { Prisma } from "@prisma/client";
import type { Role } from "@prisma/client";
import { Router } from "express";
import { randomUUID } from "node:crypto";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES, MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

const PLANNED_MODE_REASON =
  "Customers & Partners is not operational for planned service/custom-business mode yet.";

type PartnerKind = "customer" | "supplier";
type ExportKind = "customers" | "suppliers";
type ExportFormat = "csv" | "json";

type ContactInput = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

type CustomerRow = {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalSpending: number;
  transactions: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type SupplierRow = {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalPurchases: number;
  transactions: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type LoyaltyTierRow = {
  id: string;
  businessId: string;
  icon: string;
  tierName: "Bronze" | "Silver" | "Gold" | "Platinum";
  calculationPeriod: string;
  minimumSpending: number;
  automaticDiscount: string;
  sortOrder: number;
};

function isPlannedMode(businessMode: string) {
  return businessMode === "custom-business";
}

function canManage(role: Role) {
  return MANAGEMENT_ROLES.includes(role);
}

function capabilities(role: Role, businessMode: string, businessId: string) {
  const planned = isPlannedMode(businessMode);
  const manage = canManage(role) && !planned;

  return {
    businessId,
    businessMode,
    canView: !planned,
    canCreate: manage,
    canUpdate: manage,
    canDelete: manage,
    canExport: !planned,
    canImport: false,
    canSyncFromSales: false,
    isPlannedMode: planned,
    plannedReason: planned ? PLANNED_MODE_REASON : null,
  };
}

function requireSupportedMode(mode: string) {
  if (isPlannedMode(mode)) {
    throw new CustomersPartnersInputError(PLANNED_MODE_REASON, 403);
  }
}

class CustomersPartnersInputError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CustomersPartnersInputError";
    this.status = status;
  }
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalText(value: unknown) {
  const text = getText(value);
  return text ? text : null;
}

function parseContactInput(body: unknown): ContactInput {
  if (typeof body !== "object" || body === null) {
    throw new CustomersPartnersInputError("Contact payload is required.");
  }

  const record = body as Record<string, unknown>;
  const name = getText(record.name);
  const email = getOptionalText(record.email);
  const phone = getOptionalText(record.phone);
  const address = getOptionalText(record.address);

  if (!name) throw new CustomersPartnersInputError("Name is required.");
  if (email && !email.includes("@")) {
    throw new CustomersPartnersInputError("Email must be valid when provided.");
  }

  return { name, phone, email, address };
}

function parseSearch(value: unknown) {
  const search = getText(value);
  return search.length > 80 ? search.slice(0, 80) : search;
}

function parseExportKind(value: unknown): ExportKind {
  const kind = getText(value).toLowerCase();
  if (kind === "suppliers") return "suppliers";
  return "customers";
}

function parseExportFormat(value: unknown): ExportFormat {
  const format = getText(value).toLowerCase();
  if (!format || format === "csv") return "csv";
  if (format === "json") return "json";
  throw new CustomersPartnersInputError("Export format must be csv or json.");
}

async function ensureCustomersPartnersSchema() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SharedCustomerProfile" (
      "id" TEXT PRIMARY KEY,
      "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "phone" TEXT NULL,
      "email" TEXT NULL,
      "address" TEXT NULL,
      "totalSpending" INTEGER NOT NULL DEFAULT 0,
      "transactions" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SharedBusinessPartner" (
      "id" TEXT PRIMARY KEY,
      "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
      "partnerType" TEXT NOT NULL DEFAULT 'SUPPLIER',
      "name" TEXT NOT NULL,
      "phone" TEXT NULL,
      "email" TEXT NULL,
      "address" TEXT NULL,
      "totalPurchases" INTEGER NOT NULL DEFAULT 0,
      "transactions" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SharedLoyaltyTierSetting" (
      "id" TEXT PRIMARY KEY,
      "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
      "icon" TEXT NOT NULL,
      "tierName" TEXT NOT NULL,
      "calculationPeriod" TEXT NOT NULL DEFAULT 'Last 12 months',
      "minimumSpending" INTEGER NOT NULL DEFAULT 0,
      "automaticDiscount" TEXT NOT NULL DEFAULT '0%',
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SharedCustomerProfile_businessId_idx" ON "SharedCustomerProfile"("businessId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SharedCustomerProfile_isActive_idx" ON "SharedCustomerProfile"("isActive");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SharedBusinessPartner_businessId_idx" ON "SharedBusinessPartner"("businessId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SharedBusinessPartner_partnerType_idx" ON "SharedBusinessPartner"("partnerType");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SharedBusinessPartner_isActive_idx" ON "SharedBusinessPartner"("isActive");`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "SharedLoyaltyTierSetting_businessId_tierName_key" ON "SharedLoyaltyTierSetting"("businessId", "tierName");`);
}

async function seedDefaultTiers(businessId: string) {
  const existing = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "SharedLoyaltyTierSetting"
    WHERE "businessId" = ${businessId}
  `;

  if (Number(existing[0]?.count ?? 0) > 0) return;

  const tiers = [
    { icon: "B", tierName: "Bronze", minimumSpending: 1_000_000, automaticDiscount: "2%", sortOrder: 1 },
    { icon: "S", tierName: "Silver", minimumSpending: 5_000_000, automaticDiscount: "5%", sortOrder: 2 },
    { icon: "G", tierName: "Gold", minimumSpending: 10_000_000, automaticDiscount: "8%", sortOrder: 3 },
    { icon: "P", tierName: "Platinum", minimumSpending: 20_000_000, automaticDiscount: "12%", sortOrder: 4 },
  ];

  for (const tier of tiers) {
    await prisma.$executeRaw`
      INSERT INTO "SharedLoyaltyTierSetting" (
        "id", "businessId", "icon", "tierName", "minimumSpending", "automaticDiscount", "sortOrder"
      ) VALUES (
        ${randomUUID()}, ${businessId}, ${tier.icon}, ${tier.tierName}, ${tier.minimumSpending}, ${tier.automaticDiscount}, ${tier.sortOrder}
      )
      ON CONFLICT ("businessId", "tierName") DO NOTHING
    `;
  }
}

function searchFilter(search: string) {
  if (!search) return Prisma.empty;
  const query = `%${search.toLowerCase()}%`;
  return Prisma.sql`AND (
    LOWER("name") LIKE ${query}
    OR LOWER(COALESCE("phone", '')) LIKE ${query}
    OR LOWER(COALESCE("email", '')) LIKE ${query}
  )`;
}

async function listCustomers(businessId: string, search: string) {
  return prisma.$queryRaw<CustomerRow[]>`
    SELECT *
    FROM "SharedCustomerProfile"
    WHERE "businessId" = ${businessId}
      AND "isActive" = true
      ${searchFilter(search)}
    ORDER BY "updatedAt" DESC, "createdAt" DESC
  `;
}

async function listSuppliers(businessId: string, search: string) {
  return prisma.$queryRaw<SupplierRow[]>`
    SELECT
      "id", "businessId", "name", "phone", "email", "address",
      "totalPurchases", "transactions", "isActive", "createdAt", "updatedAt"
    FROM "SharedBusinessPartner"
    WHERE "businessId" = ${businessId}
      AND "partnerType" = 'SUPPLIER'
      AND "isActive" = true
      ${searchFilter(search)}
    ORDER BY "updatedAt" DESC, "createdAt" DESC
  `;
}

async function listLoyaltyTiers(businessId: string) {
  return prisma.$queryRaw<LoyaltyTierRow[]>`
    SELECT "id", "businessId", "icon", "tierName", "calculationPeriod", "minimumSpending", "automaticDiscount", "sortOrder"
    FROM "SharedLoyaltyTierSetting"
    WHERE "businessId" = ${businessId}
    ORDER BY "sortOrder" ASC, "minimumSpending" ASC
  `;
}

async function createContact(kind: PartnerKind, businessId: string, input: ContactInput) {
  const id = randomUUID();

  if (kind === "customer") {
    await prisma.$executeRaw`
      INSERT INTO "SharedCustomerProfile" (
        "id", "businessId", "name", "phone", "email", "address", "updatedAt"
      ) VALUES (
        ${id}, ${businessId}, ${input.name}, ${input.phone}, ${input.email}, ${input.address}, now()
      )
    `;

    const rows = await prisma.$queryRaw<CustomerRow[]>`
      SELECT * FROM "SharedCustomerProfile" WHERE "id" = ${id} AND "businessId" = ${businessId} LIMIT 1
    `;
    return rows[0];
  }

  await prisma.$executeRaw`
    INSERT INTO "SharedBusinessPartner" (
      "id", "businessId", "partnerType", "name", "phone", "email", "address", "updatedAt"
    ) VALUES (
      ${id}, ${businessId}, 'SUPPLIER', ${input.name}, ${input.phone}, ${input.email}, ${input.address}, now()
    )
  `;

  const rows = await prisma.$queryRaw<SupplierRow[]>`
    SELECT
      "id", "businessId", "name", "phone", "email", "address",
      "totalPurchases", "transactions", "isActive", "createdAt", "updatedAt"
    FROM "SharedBusinessPartner"
    WHERE "id" = ${id} AND "businessId" = ${businessId}
    LIMIT 1
  `;
  return rows[0];
}

async function updateContact(kind: PartnerKind, businessId: string, id: string, input: ContactInput) {
  if (kind === "customer") {
    await prisma.$executeRaw`
      UPDATE "SharedCustomerProfile"
      SET
        "name" = ${input.name},
        "phone" = ${input.phone},
        "email" = ${input.email},
        "address" = ${input.address},
        "updatedAt" = now()
      WHERE "id" = ${id}
        AND "businessId" = ${businessId}
        AND "isActive" = true
    `;

    const rows = await prisma.$queryRaw<CustomerRow[]>`
      SELECT *
      FROM "SharedCustomerProfile"
      WHERE "id" = ${id} AND "businessId" = ${businessId} AND "isActive" = true
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  await prisma.$executeRaw`
    UPDATE "SharedBusinessPartner"
    SET
      "name" = ${input.name},
      "phone" = ${input.phone},
      "email" = ${input.email},
      "address" = ${input.address},
      "updatedAt" = now()
    WHERE "id" = ${id}
      AND "businessId" = ${businessId}
      AND "partnerType" = 'SUPPLIER'
      AND "isActive" = true
  `;

  const rows = await prisma.$queryRaw<SupplierRow[]>`
    SELECT
      "id", "businessId", "name", "phone", "email", "address",
      "totalPurchases", "transactions", "isActive", "createdAt", "updatedAt"
    FROM "SharedBusinessPartner"
    WHERE "id" = ${id}
      AND "businessId" = ${businessId}
      AND "partnerType" = 'SUPPLIER'
      AND "isActive" = true
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function softDeleteContact(kind: PartnerKind, businessId: string, id: string) {
  if (kind === "customer") {
    const result = await prisma.$executeRaw`
      UPDATE "SharedCustomerProfile"
      SET "isActive" = false, "updatedAt" = now()
      WHERE "id" = ${id} AND "businessId" = ${businessId} AND "isActive" = true
    `;
    return result;
  }

  return prisma.$executeRaw`
    UPDATE "SharedBusinessPartner"
    SET "isActive" = false, "updatedAt" = now()
    WHERE "id" = ${id} AND "businessId" = ${businessId} AND "partnerType" = 'SUPPLIER' AND "isActive" = true
  `;
}

function csvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function buildContactsCsv(kind: ExportKind, rows: Array<CustomerRow | SupplierRow>) {
  const amountHeader = kind === "customers" ? "Total Spending" : "Total Purchases";
  const headers = ["ID", "Name", "Phone", "Email", "Address", amountHeader, "Transactions", "Updated At"];
  const body = rows.map((row) => {
    const amount = "totalSpending" in row ? row.totalSpending : row.totalPurchases;
    return [
      row.id,
      row.name,
      row.phone ?? "",
      row.email ?? "",
      row.address ?? "",
      amount,
      row.transactions,
      row.updatedAt,
    ].map(csvValue).join(",");
  });

  return [headers.map(csvValue).join(","), ...body].join("\n");
}

function respondInputError(res: Parameters<typeof errorResponse>[0], error: CustomersPartnersInputError) {
  return errorResponse(res, {
    status: error.status,
    code: error.status === 403 ? errorCodes.forbidden : errorCodes.validationError,
    message: error.message,
  });
}

router.get("/customers-partners-capabilities", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    return successResponse(res, {
      data: capabilities(user.role, businessContext.businessMode, businessContext.businessId),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/customers-partners-dashboard", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    const caps = capabilities(user.role, businessContext.businessMode, businessContext.businessId);
    if (!caps.canView) {
      return errorResponse(res, { status: 403, code: errorCodes.forbidden, message: caps.plannedReason ?? "Forbidden." });
    }

    await ensureCustomersPartnersSchema();
    await seedDefaultTiers(businessContext.businessId);

    const search = parseSearch(req.query.search);
    const [customers, suppliers, loyaltyTiers] = await Promise.all([
      listCustomers(businessContext.businessId, search),
      listSuppliers(businessContext.businessId, search),
      listLoyaltyTiers(businessContext.businessId),
    ]);

    return successResponse(res, {
      data: {
        capabilities: caps,
        summary: {
          totalCustomers: customers.length,
          totalSuppliers: suppliers.length,
          totalCustomerSpending: customers.reduce((total, row) => total + row.totalSpending, 0),
          totalSupplierPurchases: suppliers.reduce((total, row) => total + row.totalPurchases, 0),
        },
        customers,
        suppliers,
        loyaltyTiers,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/customers-partners/export", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    const caps = capabilities(user.role, businessContext.businessMode, businessContext.businessId);
    if (!caps.canExport) {
      return errorResponse(res, { status: 403, code: errorCodes.forbidden, message: caps.plannedReason ?? "Export is not available." });
    }

    await ensureCustomersPartnersSchema();
    const search = parseSearch(req.query.search);
    const kind = parseExportKind(req.query.kind);
    const format = parseExportFormat(req.query.format);
    const rows = kind === "customers"
      ? await listCustomers(businessContext.businessId, search)
      : await listSuppliers(businessContext.businessId, search);
    const exportedAt = new Date().toISOString();

    if (format === "json") {
      return successResponse(res, {
        data: {
          kind,
          exportedAt,
          rowCount: rows.length,
          rows,
        },
      });
    }

    const csv = buildContactsCsv(kind, rows);
    const filename = `${kind}-${exportedAt.slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("X-Exported-At", exportedAt);
    res.setHeader("X-Row-Count", String(rows.length));
    return res.status(200).send(csv);
  } catch (error) {
    if (error instanceof CustomersPartnersInputError) return respondInputError(res, error);
    return handleApiError(res, error);
  }
});

router.post("/customers-partners/customers", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    await ensureCustomersPartnersSchema();
    const customer = await createContact("customer", businessContext.businessId, parseContactInput(req.body));
    return successResponse(res, { status: 201, data: customer, message: "Customer created." });
  } catch (error) {
    if (error instanceof CustomersPartnersInputError) return respondInputError(res, error);
    return handleApiError(res, error);
  }
});

router.post("/customers-partners/suppliers", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    await ensureCustomersPartnersSchema();
    const supplier = await createContact("supplier", businessContext.businessId, parseContactInput(req.body));
    return successResponse(res, { status: 201, data: supplier, message: "Supplier created." });
  } catch (error) {
    if (error instanceof CustomersPartnersInputError) return respondInputError(res, error);
    return handleApiError(res, error);
  }
});

router.patch("/customers-partners/customers/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    await ensureCustomersPartnersSchema();
    const customer = await updateContact("customer", businessContext.businessId, req.params.id, parseContactInput(req.body));
    if (!customer) {
      return errorResponse(res, { status: 404, code: errorCodes.notFound, message: "Customer not found." });
    }
    return successResponse(res, { data: customer, message: "Customer updated." });
  } catch (error) {
    if (error instanceof CustomersPartnersInputError) return respondInputError(res, error);
    return handleApiError(res, error);
  }
});

router.patch("/customers-partners/suppliers/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    await ensureCustomersPartnersSchema();
    const supplier = await updateContact("supplier", businessContext.businessId, req.params.id, parseContactInput(req.body));
    if (!supplier) {
      return errorResponse(res, { status: 404, code: errorCodes.notFound, message: "Supplier not found." });
    }
    return successResponse(res, { data: supplier, message: "Supplier updated." });
  } catch (error) {
    if (error instanceof CustomersPartnersInputError) return respondInputError(res, error);
    return handleApiError(res, error);
  }
});

router.delete("/customers-partners/customers/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    await ensureCustomersPartnersSchema();
    const updated = await softDeleteContact("customer", businessContext.businessId, req.params.id);
    if (!updated) {
      return errorResponse(res, { status: 404, code: errorCodes.notFound, message: "Customer not found." });
    }
    return successResponse(res, { data: { id: req.params.id }, message: "Customer deleted." });
  } catch (error) {
    if (error instanceof CustomersPartnersInputError) return respondInputError(res, error);
    return handleApiError(res, error);
  }
});

router.delete("/customers-partners/suppliers/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    await ensureCustomersPartnersSchema();
    const updated = await softDeleteContact("supplier", businessContext.businessId, req.params.id);
    if (!updated) {
      return errorResponse(res, { status: 404, code: errorCodes.notFound, message: "Supplier not found." });
    }
    return successResponse(res, { data: { id: req.params.id }, message: "Supplier deleted." });
  } catch (error) {
    if (error instanceof CustomersPartnersInputError) return respondInputError(res, error);
    return handleApiError(res, error);
  }
});

export default router;
