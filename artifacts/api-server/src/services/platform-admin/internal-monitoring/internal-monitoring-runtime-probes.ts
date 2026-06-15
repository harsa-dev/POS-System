import { Client } from "pg";

import type { InternalMonitoringRuntimeProbeDto } from "./internal-monitoring.types.js";

type ProbeStatus = InternalMonitoringRuntimeProbeDto["status"];

type ProbeResult = Omit<InternalMonitoringRuntimeProbeDto, "checkedAt" | "latencyMs"> & {
  latencyMs?: number | null;
};

function createProbeResult(result: ProbeResult): InternalMonitoringRuntimeProbeDto {
  return {
    ...result,
    checkedAt: new Date().toISOString(),
    latencyMs: result.latencyMs ?? null,
  };
}

async function measureProbe(
  probe: () => Promise<Omit<ProbeResult, "latencyMs">>,
): Promise<InternalMonitoringRuntimeProbeDto> {
  const startedAt = performance.now();

  try {
    const result = await probe();
    return createProbeResult({
      ...result,
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
    });
  } catch (error) {
    return createProbeResult({
      id: "runtime-probe-unhandled-error",
      label: "Unhandled runtime probe error",
      status: "fail",
      source: "internal-monitoring-runtime-probes.ts",
      detail: error instanceof Error ? error.message : "Unknown runtime probe error.",
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
    });
  }
}

function getStatusFromDatabaseError(error: unknown): { status: ProbeStatus; detail: string } {
  const message = error instanceof Error ? error.message : "Unknown database connectivity error.";

  return {
    status: "fail",
    detail: `Database ping failed: ${message}`,
  };
}

async function probeDatabaseConnection(): Promise<Omit<ProbeResult, "latencyMs">> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return {
      id: "database-connectivity",
      label: "Database connectivity",
      status: "watch",
      source: "DATABASE_URL",
      detail: "DATABASE_URL is not configured, so the API can only report degraded database readiness.",
    };
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 1_500,
    statement_timeout: 1_500,
    query_timeout: 1_500,
  });

  try {
    await client.connect();
    await client.query("select 1 as internal_monitoring_probe");

    return {
      id: "database-connectivity",
      label: "Database connectivity",
      status: "pass",
      source: "pg select 1",
      detail: "Database connection responded to a read-only probe.",
    };
  } catch (error) {
    return {
      id: "database-connectivity",
      label: "Database connectivity",
      source: "pg select 1",
      ...getStatusFromDatabaseError(error),
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function probeApiServerRuntime(): Promise<Omit<ProbeResult, "latencyMs">> {
  return {
    id: "api-server-runtime",
    label: "API server runtime",
    status: "pass",
    source: "process.uptime",
    detail: `API process is alive. Uptime: ${Math.floor(process.uptime())} seconds.`,
  };
}

async function probeRuntimeEnvironment(): Promise<Omit<ProbeResult, "latencyMs">> {
  const nodeEnv = process.env.NODE_ENV ?? "unknown";

  return {
    id: "runtime-environment",
    label: "Runtime environment",
    status: nodeEnv === "unknown" ? "watch" : "pass",
    source: "process.env.NODE_ENV",
    detail: `NODE_ENV=${nodeEnv}. Internal Monitoring remains read-only in every environment.`,
  };
}

async function probeInternalContractInventory(): Promise<Omit<ProbeResult, "latencyMs">> {
  return {
    id: "internal-contract-inventory",
    label: "Internal contract inventory",
    status: "pass",
    source: "internal-monitoring.service.ts",
    detail: "Five GET-only Internal Monitoring contracts are available and write contracts remain blocked.",
  };
}

export async function collectInternalMonitoringRuntimeProbes(): Promise<InternalMonitoringRuntimeProbeDto[]> {
  return Promise.all([
    measureProbe(probeApiServerRuntime),
    measureProbe(probeRuntimeEnvironment),
    measureProbe(probeInternalContractInventory),
    measureProbe(probeDatabaseConnection),
  ]);
}
