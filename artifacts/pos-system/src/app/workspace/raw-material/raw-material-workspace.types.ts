import type {
  rawMaterialQualityFilterOptions,
  rawMaterialSupplierCategoryOptions,
} from "./raw-material-workspace.constants";

export type RawMaterialQualityFilterValue = (typeof rawMaterialQualityFilterOptions)[number];

export type RawMaterialSupplierCategoryFilterValue =
  (typeof rawMaterialSupplierCategoryOptions)[number];

export type RawMaterialIntakeDraft = Readonly<{
  id: string;
  materialName: string;
  supplierId: string;
  targetStorageId: string;
  quantityKg: number;
  status: "draft";
}>;

export type RawMaterialWeighingDraft = Readonly<{
  id: string;
  intakeReference: string;
  grossKg: number;
  tareKg: number;
  netKg: number;
  status: "draft";
}>;
