import { Client } from "pg";

import type {
  InternalSystemProbeHistoryDto,
  InternalSystemProbeHistoryItemDto,
  InternalSystemProbeStatus,
} from "./internal-monitoring.types.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const RETENTION_DAYS = 14;

type ProbeHistoryQuery = {
  probeId?: string;
  status?: InternalSystemProbeStatus;
  area?: string;
  from?: string;
  to?: string;
  limit?: number;
};

type ProbeHistoryRow = {
  id: string;
  probeId: string;
  label: string;
  area: string;
  status: InternalSystemProbeStatus;
  latencyMs: number | null;
  message: string;
  observedAt: Date;
  source: string;
  metadataJson: unknown | null;
  createdAt: Date;
};

function clampLimit(limit: number | undefined) {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function createEmptyHistory(
  query: ProbeHistoryQuery,
  persistenceStatus: InternalSystemProbeHistoryDto["summary"]["persistenceStatus"],
  detail: string,
): InternalSystemProbeHistoryDto {
  const limit = clampLimit(query.limit);

  return {
    generatedAt: new Date().toISOString(),
    items: [],
    summary: {
      total: 0,
      pass: 0,
      watch: 0,
      fail: 0,
      retentionDays: RETENTION_DAYS,
      persistenceStatus,
      detail,
    },
    filters: {
      probeId: query.probeId,
      status: query.status,
      area: query.area,
      from: query.from,
      to: query.to,
      limit,
    },
  };
}

function buildWhereClause(query: ProbeHistoryQuery) {
  const where: string[] = [
    `"observed_at" >= now() - interval '${RETENTION_DAYS} days'`,
  ];
  const values: unknown[] = [];

  if (query.probeId) {
    values.push(query.probeId);
    where.push(`"probe_id" = $${values.length}`);
  }

  if (query.status) {
    values.push(query.status);
    where.push(`"status" = $${values.length}`);
  }

  if (query.area) {
    values.push(query.area);
    where.push(`"area" = $${values.length}`);
  }

  if (query.from) {
    values.push(query.from);
    where.push(`"observed_at" >= $${values.length}`);
  }

  if (query.to) {
    values.push(query.to);
    where.push(`"observed_at" <= $${values.length}`);
  }

  return {
    clause: where.length > 0 ? `where ${where.join(" and ")}` : "",
    values,
  };
}

function mapHistoryRow(row: ProbeHistoryRow): InternalSystemProbeHistoryItemDto {
  return {
    id: row.id,
    probeId: row.probeId,
    label: row.label,
    area: row.area,
    status: row.status,
    latencyMs: row.latencyMs,
    message: row.message,
    observedAt: toIso(row.observedAt),
    source: row.source,
    metadataJson: row.metadataJson,
    createdAt: toIso(row.createdAt),
  };
}

function createHistorySummary(items: InternalSystemProbeHistoryItemDto[]): InternalSystemProbeHistoryDto["summary"] {
  return {
    total: items.length,
    pass: items.filter((item) => item.status === "pass").length,
    watch: items.filter((item) => item.status === "watch").length,
    fail: items.filter((item) => item.status === "fail").length,
    retentionDays: RETENTION_DAYS,
    persistenceStatus: "ready",
    detail: items.length > 0
      ? "Probe history was loaded from internal_system_probes."
      : "Probe history table is ready, but no snapshots matched the current filter.",
  };
}

function isMissingTableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "42P01"
  );
}

export async function getInternalSystemProbeHistory(query: ProbeHistoryQuery = {}): Promise<InternalSystemProbeHistoryDto> {
  const connectionString = process.env.DATABASE_URL;
  const limit = clampLimit(query.limit);

  if (!connectionString) {
    return createEmptyHistory(
      { ...query, limit },
      "not-configured",
      "DATABASE_URL is not configured, so probe history cannot be read.",
    );
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 1_500,
    statement_timeout: 2_500,
    query_timeout: 2_500,
  });

  try {
    await client.connect();

    const { clause, values } = buildWhereClause({ ...query, limit });
    values.push(limit);

    const result = await client.query<ProbeHistoryRow>(
      `select
        "id",
        "probe_id" as "probeId",
        "label",
        "area",
        "status",
        "latency_ms" as "latencyMs",
        "message",
        "observed_at" as "observedAt",
        "source",
        "metadata_json" as "metadataJson",
        "created_at" as "createdAt"
      from "internal_system_probes"
      ${clause}
      order by "observed_at" desc
      limit $${values.length}`,
      values,
    );

    const items = result.rows.map(mapHistoryRow);

    return {
      generatedAt: new Date().toISOString(),
      items,
      summary: createHistorySummary(items),
      filters: {
        probeId: query.probeId,
        status: query.status,
        area: query.area,
        from: query.from,
        to: query.to,
        limit,
      },
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return createEmptyHistory(
        { ...query, limit },
        "schema-missing",
        "internal_system_probes table is missing. Run the InternalSystemProbe migration before using history.",
      );
    }

    return createEmptyHistory(
      { ...query, limit },
      "database-unavailable",
      error instanceof Error ? error.message : "Unknown database error while reading probe history.",
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}
