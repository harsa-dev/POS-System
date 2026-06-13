import { rawMaterialApiContracts } from "./raw-material.api-contract";
import {
  rawMaterialBatches,
  rawMaterialIntakes,
  rawMaterialKandangPens,
  rawMaterialMetrics,
  rawMaterialProcessingRuns,
  rawMaterialScaleFeatures,
  rawMaterialScaleProfiles,
  rawMaterialStorageLocations,
  rawMaterialSuppliers,
  rawMaterialWeighings,
} from "./raw-material.mock-data";
import type {
  RawMaterialApiEnvelope,
  RawMaterialBatch,
  RawMaterialBatchQuery,
  RawMaterialContractReadiness,
  RawMaterialIntake,
  RawMaterialIntakeQuery,
  RawMaterialKandangPen,
  RawMaterialMetric,
  RawMaterialProcessingRun,
  RawMaterialScaleFeature,
  RawMaterialScaleProfile,
  RawMaterialStorageLocation,
  RawMaterialSupplier,
  RawMaterialSupplierQuery,
  RawMaterialWeighing,
  RawMaterialWorkspaceModuleId,
} from "./raw-material.types";

function createMockEnvelope<TData>(
  data: TData,
  total?: number,
): RawMaterialApiEnvelope<TData> {
  return {
    success: true,
    data,
    meta: {
      source: "mock",
      schemaTouched: false,
      generatedAt: "2026-06-13T00:00:00.000Z",
      total,
    },
  };
}

function textMatches(value: string, search?: string) {
  if (!search) return true;

  return value.toLowerCase().includes(search.toLowerCase());
}

export const rawMaterialMockService = {
  getMetrics(): RawMaterialApiEnvelope<readonly RawMaterialMetric[]> {
    return createMockEnvelope(rawMaterialMetrics, rawMaterialMetrics.length);
  },

  listScaleProfiles(): RawMaterialApiEnvelope<readonly RawMaterialScaleProfile[]> {
    return createMockEnvelope(rawMaterialScaleProfiles, rawMaterialScaleProfiles.length);
  },

  listScaleFeatures(): RawMaterialApiEnvelope<readonly RawMaterialScaleFeature[]> {
    return createMockEnvelope(rawMaterialScaleFeatures, rawMaterialScaleFeatures.length);
  },

  listSuppliers(
    query: RawMaterialSupplierQuery = {},
  ): RawMaterialApiEnvelope<readonly RawMaterialSupplier[]> {
    const suppliers = rawMaterialSuppliers.filter((supplier) => {
      const matchesCategory = query.category ? supplier.category === query.category : true;
      const matchesSearch = textMatches(
        `${supplier.name} ${supplier.contactPerson} ${supplier.category}`,
        query.search,
      );

      return matchesCategory && matchesSearch;
    });

    return createMockEnvelope(suppliers, suppliers.length);
  },

  listIntakes(
    query: RawMaterialIntakeQuery = {},
  ): RawMaterialApiEnvelope<readonly RawMaterialIntake[]> {
    const intakes = rawMaterialIntakes.filter((intake) => {
      const supplier = rawMaterialSuppliers.find((candidate) => candidate.id === intake.supplierId);
      const matchesSupplier = query.supplierId ? intake.supplierId === query.supplierId : true;
      const matchesQuality = query.qualityStatus ? intake.qualityStatus === query.qualityStatus : true;
      const matchesSearch = textMatches(
        `${intake.referenceNumber} ${intake.materialName} ${supplier?.name ?? ""}`,
        query.search,
      );

      return matchesSupplier && matchesQuality && matchesSearch;
    });

    return createMockEnvelope(intakes, intakes.length);
  },

  listWeighings(): RawMaterialApiEnvelope<readonly RawMaterialWeighing[]> {
    return createMockEnvelope(rawMaterialWeighings, rawMaterialWeighings.length);
  },

  listBatches(
    query: RawMaterialBatchQuery = {},
  ): RawMaterialApiEnvelope<readonly RawMaterialBatch[]> {
    const batches = rawMaterialBatches.filter((batch) => {
      const matchesStorage = query.storageId ? batch.storageId === query.storageId : true;
      const matchesQuality = query.qualityStatus ? batch.qualityStatus === query.qualityStatus : true;
      const matchesSearch = textMatches(
        `${batch.lotCode} ${batch.materialName}`,
        query.search,
      );

      return matchesStorage && matchesQuality && matchesSearch;
    });

    return createMockEnvelope(batches, batches.length);
  },

  listStorageLocations(): RawMaterialApiEnvelope<readonly RawMaterialStorageLocation[]> {
    return createMockEnvelope(rawMaterialStorageLocations, rawMaterialStorageLocations.length);
  },

  listProcessingRuns(): RawMaterialApiEnvelope<readonly RawMaterialProcessingRun[]> {
    return createMockEnvelope(rawMaterialProcessingRuns, rawMaterialProcessingRuns.length);
  },

  listKandangPens(): RawMaterialApiEnvelope<readonly RawMaterialKandangPen[]> {
    return createMockEnvelope(rawMaterialKandangPens, rawMaterialKandangPens.length);
  },

  getContractReadiness(
    moduleId: RawMaterialWorkspaceModuleId,
  ): RawMaterialContractReadiness {
    const contracts = rawMaterialApiContracts.filter((contract) => contract.moduleId === moduleId);
    const mockOnlyContracts = contracts.filter((contract) => contract.persistence === "mock-only").length;
    const futureDbContracts = contracts.filter((contract) => contract.persistence === "future-db").length;
    const hasReadContract = contracts.some((contract) => contract.method === "GET");
    const hasWriteContract = contracts.some(
      (contract) => contract.method === "POST" || contract.method === "PATCH",
    );

    return {
      moduleId,
      totalContracts: contracts.length,
      mockOnlyContracts,
      futureDbContracts,
      hasReadContract,
      hasWriteContract,
      readinessLabel: hasWriteContract
        ? "write-planned"
        : hasReadContract
          ? "read-ready"
          : "preview-only",
    };
  },
};
