export type InternalMonitoringMutationReadinessStatus =
  | "Blocked"
  | "Design Ready"
  | "Dry-run Only";

export type InternalMonitoringMutationReadinessContractDto = {
  id: string;
  action: string;
  targetSurface: string;
  proposedEndpoint: string;
  proposedMethod: "POST" | "PATCH" | "DELETE";
  status: InternalMonitoringMutationReadinessStatus;
  dryRunMode: "Required" | "Not Ready";
  requiredCapability: string;
  requiredAuditEvent: string;
  requiredApproval: string;
  rollbackPlan: string;
  rateLimit: string;
  blockedReason: string;
  requiredProof: string[];
};

export function getInternalMonitoringMutationReadinessContracts(): InternalMonitoringMutationReadinessContractDto[] {
  return [
    {
      id: "alert-acknowledge-dry-run",
      action: "Acknowledge internal alert",
      targetSurface: "Internal Monitoring Alerts",
      proposedEndpoint: "PATCH /api/internal/alerts/:alertId/acknowledge",
      proposedMethod: "PATCH",
      status: "Dry-run Only",
      dryRunMode: "Required",
      requiredCapability: "platform-admin.internal-monitoring.alerts.acknowledge",
      requiredAuditEvent: "platform_admin.internal_alert.acknowledge_requested",
      requiredApproval: "Not required for dry-run. Required for real acknowledgement if alert severity is critical.",
      rollbackPlan: "Store previous acknowledgement state and note before any future write path is enabled.",
      rateLimit: "10 requests per minute per platform admin user after mutation is implemented.",
      blockedReason: "Real acknowledgement remains blocked until audit write and approval policy are implemented.",
      requiredProof: [
        "Audit event registry entry exists.",
        "Approval policy for critical alerts exists.",
        "Dry-run response validates target alert and user capability without mutating data.",
      ],
    },
    {
      id: "route-snapshot-refresh-dry-run",
      action: "Refresh route inventory snapshot",
      targetSurface: "Route Inventory",
      proposedEndpoint: "POST /api/internal/routes/inventory/refresh",
      proposedMethod: "POST",
      status: "Blocked",
      dryRunMode: "Required",
      requiredCapability: "platform-admin.internal-monitoring.routes.refresh",
      requiredAuditEvent: "platform_admin.route_inventory.refresh_requested",
      requiredApproval: "Required before replacing any persisted route snapshot.",
      rollbackPlan: "Keep previous snapshot version and diff summary for rollback before promotion.",
      rateLimit: "2 requests per minute per platform admin user after mutation is implemented.",
      blockedReason: "No persisted route snapshot exists yet, so refresh mutation has no safe target.",
      requiredProof: [
        "Route snapshot persistence model is approved.",
        "Snapshot diff format is documented.",
        "Rollback path can restore previous snapshot version.",
      ],
    },
    {
      id: "schema-candidate-promote-dry-run",
      action: "Promote internal schema candidate",
      targetSurface: "Schema Risk",
      proposedEndpoint: "POST /api/internal/schema-candidates/:candidateId/promote",
      proposedMethod: "POST",
      status: "Blocked",
      dryRunMode: "Required",
      requiredCapability: "platform-admin.internal-monitoring.schema.promote",
      requiredAuditEvent: "platform_admin.schema_candidate.promote_requested",
      requiredApproval: "Required from OWNER plus technical reviewer before any migration is generated.",
      rollbackPlan: "Migration must include down-plan notes, seed rollback notes, and data retention policy.",
      rateLimit: "1 request per hour per platform admin user after mutation is implemented.",
      blockedReason: "Schema promotion is explicitly blocked until persistence proof exists.",
      requiredProof: [
        "Historical retention requirement exists.",
        "Migration plan has been reviewed.",
        "Dry-run can produce migration impact summary without writing schema files.",
      ],
    },
  ];
}
