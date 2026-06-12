import { AuditAction } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { prisma } from "../../lib/prisma.js";
import type {
  FinancialReportActor,
  FinancialReportQuery,
} from "./financial-reports.types.js";
import type { ReportExportFormat } from "./report-export.js";

type FinancialReportAuditEvent = "EXPORT";

function serializeQuery(query: FinancialReportQuery) {
  return {
    from: query.from.toISOString(),
    to: query.to.toISOString(),
    basis: query.basis,
  };
}

function buildEntityId(params: {
  event: FinancialReportAuditEvent;
  query: FinancialReportQuery;
  format?: ReportExportFormat;
}) {
  const from = params.query.from.toISOString().slice(0, 10);
  const to = params.query.to.toISOString().slice(0, 10);
  const format = params.format ?? "view";

  return `${params.event}:${from}:${to}:${params.query.basis}:${format}`;
}

export async function logFinancialReportExport(params: {
  actor: FinancialReportActor;
  businessContext: BusinessContext;
  query: FinancialReportQuery;
  format: ReportExportFormat;
  filename: string;
  contentType: string;
}) {
  await prisma.auditLog.create({
    data: {
      restaurantId: params.businessContext.restaurantId,
      userId: params.actor.id,
      action: AuditAction.CREATE,
      entityType: "FinancialReportExport",
      entityId: buildEntityId({
        event: "EXPORT",
        query: params.query,
        format: params.format,
      }),
      changes: {
        query: serializeQuery(params.query),
        format: params.format,
        filename: params.filename,
        contentType: params.contentType,
      },
    },
  });
}
