import type { Role } from "@prisma/client";
import { Router } from "express";
import { randomUUID } from "node:crypto";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

const MAX_IMPORT_CHARS = 150_000;
const MAX_IMPORT_ROWS = 300;
const PLANNED_MODE_REASON =
  "Customers & Partners import is not operational for planned service/custom-business mode yet.";

type ImportKind = "customers" | "suppliers";
type ImportStatus = "ready" | "error" | "duplicate";

type ParsedContact = {
  rowNumber: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: ImportStatus;
  errors: string[];
};

type ImportPayload = {
  kind: ImportKind;
  csvText: string;
};

type ImportResultRow = ParsedContact & {
  action: "created" | "updated" | "skipped";
  contactId: string | null;
};

function isPlannedMode(businessMode: string) {
  return businessMode === "custom-business";
}

function requireSupportedMode(mode: string) {
  if (isPlannedMode(mode)) {
    throw new CustomersPartnersImportError(PLANNED_MODE_REASON, 403);
  }
}

function canImport(role: Role) {
  return MANAGEMENT_ROLES.includes(role);
}

class CustomersPartnersImportError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CustomersPartnersImportError";
    this.status = status;
  }
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseImportKind(value: unknown): ImportKind {
  const kind = getText(value).toLowerCase();
  if (kind === "suppliers") return "suppliers";
  if (kind === "customers") return "customers";
  throw new CustomersPartnersImportError("Import kind must be customers or suppliers.");
}

function parsePayload(body: unknown): ImportPayload {
  if (typeof body !== "object" || body === null) {
    throw new CustomersPartnersImportError("Import payload is required.");
  }

  const record = body as Record<string, unknown>;
  const csvText = getText(record.csvText);

  if (!csvText) throw new CustomersPartnersImportError("CSV text is required.");
  if (csvText.length > MAX_IMPORT_CHARS) {
    throw new CustomersPartnersImportError(`CSV import is too large. Maximum size is ${MAX_IMPORT_CHARS} characters.`);
  }

  return {
    kind: parseImportKind(record.kind),
    csvText,
  };
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeKey(row: Pick<ParsedContact, "name" | "phone" | "email">) {
  if (row.email) return `email:${row.email.toLowerCase()}`;
  if (row.phone) return `phone:${row.phone.replace(/[^0-9]/g, "")}`;
  return `name:${row.name.toLowerCase()}`;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      current = "";
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      continue;
    }

    current += char;
  }

  row.push(current.trim());
  if (row.some((cell) => cell.trim())) rows.push(row);

  return rows;
}

function getColumnIndex(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeader(header)));
}

function cell(row: string[], index: number) {
  if (index < 0) return null;
  const value = row[index]?.trim() ?? "";
  return value ? value : null;
}

function validateEmail(email: string | null) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseContactsFromCsv(csvText: string): ParsedContact[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    throw new CustomersPartnersImportError("CSV must include a header row and at least one data row.");
  }

  const [headers, ...dataRows] = rows;
  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new CustomersPartnersImportError(`CSV import supports up to ${MAX_IMPORT_ROWS} data rows per upload.`);
  }

  const nameIndex = getColumnIndex(headers, ["name", "customer name", "supplier name", "contact name"]);
  const phoneIndex = getColumnIndex(headers, ["phone", "phone number", "mobile", "whatsapp", "wa"]);
  const emailIndex = getColumnIndex(headers, ["email", "email address"]);
  const addressIndex = getColumnIndex(headers, ["address", "location"]);

  if (nameIndex < 0) {
    throw new CustomersPartnersImportError("CSV must include a Name column.");
  }

  const seen = new Set<string>();

  return dataRows.map((row, index) => {
    const parsed: ParsedContact = {
      rowNumber: index + 2,
      name: cell(row, nameIndex) ?? "",
      phone: cell(row, phoneIndex),
      email: cell(row, emailIndex),
      address: cell(row, addressIndex),
      status: "ready",
      errors: [],
    };

    if (!parsed.name) parsed.errors.push("Name is required.");
    if (parsed.email && !validateEmail(parsed.email)) parsed.errors.push("Email must be valid.");

    const key = normalizeKey(parsed);
    if (seen.has(key)) parsed.errors.push("Duplicate contact in this CSV file.");
    seen.add(key);

    if (parsed.errors.length > 0) {
      parsed.status = parsed.errors.some((error) => error.includes("Duplicate")) ? "duplicate" : "error";
    }

    return parsed;
  });
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

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SharedCustomerProfile_businessId_idx" ON "SharedCustomerProfile"("businessId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SharedBusinessPartner_businessId_idx" ON "SharedBusinessPartner"("businessId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SharedBusinessPartner_partnerType_idx" ON "SharedBusinessPartner"("partnerType");`);
}

async function findExistingContact(kind: ImportKind, businessId: string, input: ParsedContact) {
  if (kind === "customers") {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "SharedCustomerProfile"
      WHERE "businessId" = ${businessId}
        AND "isActive" = true
        AND (
          (${input.email}::text IS NOT NULL AND LOWER(COALESCE("email", '')) = LOWER(${input.email ?? ""}))
          OR (${input.phone}::text IS NOT NULL AND COALESCE("phone", '') = ${input.phone ?? ""})
          OR LOWER("name") = LOWER(${input.name})
        )
      LIMIT 1
    `;
    return rows[0]?.id ?? null;
  }

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "SharedBusinessPartner"
    WHERE "businessId" = ${businessId}
      AND "partnerType" = 'SUPPLIER'
      AND "isActive" = true
      AND (
        (${input.email}::text IS NOT NULL AND LOWER(COALESCE("email", '')) = LOWER(${input.email ?? ""}))
        OR (${input.phone}::text IS NOT NULL AND COALESCE("phone", '') = ${input.phone ?? ""})
        OR LOWER("name") = LOWER(${input.name})
      )
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

async function upsertImportedContact(kind: ImportKind, businessId: string, input: ParsedContact): Promise<ImportResultRow> {
  const existingId = await findExistingContact(kind, businessId, input);

  if (existingId) {
    if (kind === "customers") {
      await prisma.$executeRaw`
        UPDATE "SharedCustomerProfile"
        SET "name" = ${input.name}, "phone" = ${input.phone}, "email" = ${input.email}, "address" = ${input.address}, "updatedAt" = now()
        WHERE "id" = ${existingId} AND "businessId" = ${businessId}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "SharedBusinessPartner"
        SET "name" = ${input.name}, "phone" = ${input.phone}, "email" = ${input.email}, "address" = ${input.address}, "updatedAt" = now()
        WHERE "id" = ${existingId} AND "businessId" = ${businessId} AND "partnerType" = 'SUPPLIER'
      `;
    }

    return { ...input, action: "updated", contactId: existingId };
  }

  const id = randomUUID();
  if (kind === "customers") {
    await prisma.$executeRaw`
      INSERT INTO "SharedCustomerProfile" (
        "id", "businessId", "name", "phone", "email", "address", "updatedAt"
      ) VALUES (
        ${id}, ${businessId}, ${input.name}, ${input.phone}, ${input.email}, ${input.address}, now()
      )
    `;
  } else {
    await prisma.$executeRaw`
      INSERT INTO "SharedBusinessPartner" (
        "id", "businessId", "partnerType", "name", "phone", "email", "address", "updatedAt"
      ) VALUES (
        ${id}, ${businessId}, 'SUPPLIER', ${input.name}, ${input.phone}, ${input.email}, ${input.address}, now()
      )
    `;
  }

  return { ...input, action: "created", contactId: id };
}

function summarizePreview(kind: ImportKind, rows: ParsedContact[]) {
  return {
    kind,
    rowCount: rows.length,
    readyCount: rows.filter((row) => row.status === "ready").length,
    errorCount: rows.filter((row) => row.status === "error").length,
    duplicateCount: rows.filter((row) => row.status === "duplicate").length,
    rows,
  };
}

function respondInputError(res: Parameters<typeof errorResponse>[0], error: CustomersPartnersImportError) {
  return errorResponse(res, {
    status: error.status,
    code: error.status === 403 ? errorCodes.forbidden : errorCodes.validationError,
    message: error.message,
  });
}

router.post("/customers-partners/import-preview", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    if (!canImport(user.role)) throw new CustomersPartnersImportError("Import is not allowed for this role.", 403);

    await ensureCustomersPartnersSchema();
    const payload = parsePayload(req.body);
    const rows = parseContactsFromCsv(payload.csvText);

    return successResponse(res, {
      data: summarizePreview(payload.kind, rows),
    });
  } catch (error) {
    if (error instanceof CustomersPartnersImportError) return respondInputError(res, error);
    return handleApiError(res, error);
  }
});

router.post("/customers-partners/import-commit", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    if (!canImport(user.role)) throw new CustomersPartnersImportError("Import is not allowed for this role.", 403);

    await ensureCustomersPartnersSchema();
    const payload = parsePayload(req.body);
    const previewRows = parseContactsFromCsv(payload.csvText);
    const resultRows: ImportResultRow[] = [];

    for (const row of previewRows) {
      if (row.status !== "ready") {
        resultRows.push({ ...row, action: "skipped", contactId: null });
        continue;
      }

      resultRows.push(await upsertImportedContact(payload.kind, businessContext.businessId, row));
    }

    return successResponse(res, {
      data: {
        kind: payload.kind,
        rowCount: resultRows.length,
        created: resultRows.filter((row) => row.action === "created").length,
        updated: resultRows.filter((row) => row.action === "updated").length,
        skipped: resultRows.filter((row) => row.action === "skipped").length,
        importedAt: new Date().toISOString(),
        rows: resultRows,
      },
      message: "Contacts import completed.",
    });
  } catch (error) {
    if (error instanceof CustomersPartnersImportError) return respondInputError(res, error);
    return handleApiError(res, error);
  }
});

export default router;
