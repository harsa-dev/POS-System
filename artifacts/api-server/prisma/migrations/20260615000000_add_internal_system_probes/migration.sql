-- Internal Monitoring probe history.
-- This table stores read-only runtime probe snapshots after the collector is explicitly enabled.
-- It does not enable alert acknowledgement, tenant actions, or any internal mutation workflow.

CREATE TABLE IF NOT EXISTS "internal_system_probes" (
  "id" TEXT NOT NULL,
  "probe_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "latency_ms" INTEGER,
  "message" TEXT NOT NULL,
  "observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" TEXT NOT NULL,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "internal_system_probes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "internal_system_probes_status_check" CHECK ("status" IN ('pass', 'watch', 'fail'))
);

CREATE INDEX IF NOT EXISTS "internal_system_probes_probe_id_observed_at_idx"
  ON "internal_system_probes" ("probe_id", "observed_at");

CREATE INDEX IF NOT EXISTS "internal_system_probes_status_observed_at_idx"
  ON "internal_system_probes" ("status", "observed_at");

CREATE INDEX IF NOT EXISTS "internal_system_probes_area_observed_at_idx"
  ON "internal_system_probes" ("area", "observed_at");

CREATE INDEX IF NOT EXISTS "internal_system_probes_observed_at_idx"
  ON "internal_system_probes" ("observed_at");
