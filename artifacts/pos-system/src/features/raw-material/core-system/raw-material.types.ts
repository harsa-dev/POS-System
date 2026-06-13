export type RawMaterialWorkspaceModuleId =
  | "intake"
  | "weighing"
  | "batches"
  | "storage"
  | "processing"
  | "kandang"
  | "suppliers";

export type RawMaterialQualityStatus = "accepted" | "inspection" | "rejected";

export type RawMaterialSupplier = Readonly<{
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  category: "Feed" | "Livestock" | "Packaging" | "Raw Goods";
  reliabilityScore: number;
  leadTimeDays: number;
}>;

export type RawMaterialIntake = Readonly<{
  id: string;
  referenceNumber: string;
  supplierId: string;
  materialName: string;
  unit: "kg" | "sack" | "crate" | "head";
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  qualityStatus: RawMaterialQualityStatus;
  receivedAt: string;
  targetStorageId: string;
}>;

export type RawMaterialWeighing = Readonly<{
  id: string;
  referenceNumber: string;
  intakeId: string;
  stationName: string;
  grossKg: number;
  tareKg: number;
  netKg: number;
  operatorName: string;
  measuredAt: string;
}>;

export type RawMaterialBatch = Readonly<{
  id: string;
  lotCode: string;
  intakeId: string;
  materialName: string;
  quantityKg: number;
  remainingKg: number;
  qualityStatus: RawMaterialQualityStatus;
  expiryDate: string;
  storageId: string;
}>;

export type RawMaterialStorageLocation = Readonly<{
  id: string;
  code: string;
  name: string;
  type: "Dry" | "Cold" | "Open Yard" | "Kandang Support";
  capacityKg: number;
  usedKg: number;
}>;

export type RawMaterialProcessingRun = Readonly<{
  id: string;
  runNumber: string;
  inputBatchId: string;
  outputName: string;
  inputKg: number;
  outputKg: number;
  byproductKg: number;
  status: "planned" | "running" | "completed";
}>;

export type RawMaterialKandangPen = Readonly<{
  id: string;
  code: string;
  flockName: string;
  capacity: number;
  occupancy: number;
  feedBatchId: string;
  healthStatus: "stable" | "monitoring" | "critical";
}>;

export type RawMaterialMetric = Readonly<{
  label: string;
  value: string;
  helper: string;
}>;

export type RawMaterialModuleMetadata = Readonly<{
  id: RawMaterialWorkspaceModuleId;
  title: string;
  eyebrow: string;
  description: string;
  operationalGoal: string;
  checkpoints: readonly string[];
}>;

export type RawMaterialApiMethod = "GET" | "POST" | "PATCH";

export type RawMaterialApiContract = Readonly<{
  id: string;
  moduleId: RawMaterialWorkspaceModuleId;
  method: RawMaterialApiMethod;
  path: string;
  purpose: string;
  requestShape: string;
  responseShape: string;
  persistence: "mock-only" | "future-db";
}>;

export type RawMaterialApiEnvelope<TData> = Readonly<{
  success: true;
  data: TData;
  meta: {
    source: "mock";
    schemaTouched: false;
    generatedAt: string;
    total?: number;
  };
}>;

export type RawMaterialIntakeQuery = Readonly<{
  supplierId?: string;
  qualityStatus?: RawMaterialQualityStatus;
  search?: string;
}>;

export type RawMaterialBatchQuery = Readonly<{
  storageId?: string;
  qualityStatus?: RawMaterialQualityStatus;
  search?: string;
}>;

export type RawMaterialSupplierQuery = Readonly<{
  category?: RawMaterialSupplier["category"];
  search?: string;
}>;

export type RawMaterialContractReadiness = Readonly<{
  moduleId: RawMaterialWorkspaceModuleId;
  totalContracts: number;
  mockOnlyContracts: number;
  futureDbContracts: number;
  hasReadContract: boolean;
  hasWriteContract: boolean;
  readinessLabel: "preview-only" | "read-ready" | "write-planned";
}>;

export type RawMaterialBusinessScale = "small" | "medium" | "factory";

export type RawMaterialScaleFeatureStatus = "available" | "new-dummy" | "future-production";

export type RawMaterialScaleFeature = Readonly<{
  id: string;
  scale: RawMaterialBusinessScale;
  title: string;
  dashboardArea: string;
  purpose: string;
  whyItMatters: string;
  status: RawMaterialScaleFeatureStatus;
  dummyMetric: string;
}>;

export type RawMaterialScaleProfile = Readonly<{
  scale: RawMaterialBusinessScale;
  label: string;
  businessShape: string;
  operatingStyle: string;
  mustHaveFocus: readonly string[];
  dashboardGoal: string;
}>;
