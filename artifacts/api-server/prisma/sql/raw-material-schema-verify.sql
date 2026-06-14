-- Postflight verification for scoped Raw Material database setup.
-- This fails loudly when a database has partial Raw Material tables instead of silently accepting drift.

DO $$
DECLARE
  missing_tables TEXT[];
  missing_columns TEXT[];
  missing_enum_values TEXT[];
BEGIN
  SELECT ARRAY_AGG(required.table_name)
  INTO missing_tables
  FROM (
    VALUES
      ('RawMaterialSupplier'),
      ('RawMaterialStorageLocation'),
      ('RawMaterialIntake'),
      ('RawMaterialWeighing'),
      ('RawMaterialBatch'),
      ('RawMaterialProcessingRun'),
      ('RawMaterialKandangPen'),
      ('RawMaterialStockMovement')
  ) AS required(table_name)
  WHERE TO_REGCLASS(FORMAT('public.%I', required.table_name)) IS NULL;

  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION
      'Raw Material scoped database setup failed. Missing Raw Material table(s): %.',
      missing_tables;
  END IF;

  SELECT ARRAY_AGG(required.table_name || '.' || required.column_name)
  INTO missing_columns
  FROM (
    VALUES
      ('RawMaterialSupplier', 'id'),
      ('RawMaterialSupplier', 'businessId'),
      ('RawMaterialSupplier', 'name'),
      ('RawMaterialStorageLocation', 'id'),
      ('RawMaterialStorageLocation', 'businessId'),
      ('RawMaterialStorageLocation', 'code'),
      ('RawMaterialStorageLocation', 'capacityKg'),
      ('RawMaterialStorageLocation', 'usedKg'),
      ('RawMaterialIntake', 'id'),
      ('RawMaterialIntake', 'businessId'),
      ('RawMaterialIntake', 'referenceNumber'),
      ('RawMaterialIntake', 'supplierId'),
      ('RawMaterialIntake', 'targetStorageLocationId'),
      ('RawMaterialIntake', 'qualityStatus'),
      ('RawMaterialWeighing', 'id'),
      ('RawMaterialWeighing', 'businessId'),
      ('RawMaterialWeighing', 'intakeId'),
      ('RawMaterialWeighing', 'netKg'),
      ('RawMaterialBatch', 'id'),
      ('RawMaterialBatch', 'businessId'),
      ('RawMaterialBatch', 'lotCode'),
      ('RawMaterialBatch', 'intakeId'),
      ('RawMaterialBatch', 'storageLocationId'),
      ('RawMaterialBatch', 'remainingQuantity'),
      ('RawMaterialBatch', 'qualityStatus'),
      ('RawMaterialProcessingRun', 'id'),
      ('RawMaterialProcessingRun', 'businessId'),
      ('RawMaterialProcessingRun', 'runNumber'),
      ('RawMaterialProcessingRun', 'inputBatchId'),
      ('RawMaterialProcessingRun', 'status'),
      ('RawMaterialKandangPen', 'id'),
      ('RawMaterialKandangPen', 'businessId'),
      ('RawMaterialKandangPen', 'code'),
      ('RawMaterialKandangPen', 'feedBatchId'),
      ('RawMaterialKandangPen', 'healthStatus'),
      ('RawMaterialStockMovement', 'id'),
      ('RawMaterialStockMovement', 'businessId'),
      ('RawMaterialStockMovement', 'batchId'),
      ('RawMaterialStockMovement', 'type'),
      ('RawMaterialStockMovement', 'reason'),
      ('RawMaterialStockMovement', 'source'),
      ('RawMaterialStockMovement', 'sourceId'),
      ('RawMaterialStockMovement', 'beforeQuantity'),
      ('RawMaterialStockMovement', 'afterQuantity')
  ) AS required(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns columns
    WHERE columns.table_schema = 'public'
      AND columns.table_name = required.table_name
      AND columns.column_name = required.column_name
  );

  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION
      'Raw Material scoped database setup found partial or drifted Raw Material table(s). Missing required column(s): %.',
      missing_columns;
  END IF;

  SELECT ARRAY_AGG(required.type_name || '.' || required.enum_value)
  INTO missing_enum_values
  FROM (
    VALUES
      ('BusinessMode', 'RAW_MATERIAL'),
      ('BusinessType', 'RAW_MATERIAL'),
      ('RawMaterialSupplierCategory', 'FEED'),
      ('RawMaterialSupplierCategory', 'LIVESTOCK'),
      ('RawMaterialSupplierCategory', 'PACKAGING'),
      ('RawMaterialSupplierCategory', 'RAW_GOODS'),
      ('RawMaterialStorageType', 'DRY'),
      ('RawMaterialStorageType', 'COLD'),
      ('RawMaterialStorageType', 'OPEN_YARD'),
      ('RawMaterialStorageType', 'KANDANG_SUPPORT'),
      ('RawMaterialUnit', 'KG'),
      ('RawMaterialUnit', 'SACK'),
      ('RawMaterialUnit', 'CRATE'),
      ('RawMaterialUnit', 'HEAD'),
      ('RawMaterialUnit', 'LITER'),
      ('RawMaterialUnit', 'PCS'),
      ('RawMaterialIntakeStatus', 'DRAFT'),
      ('RawMaterialIntakeStatus', 'INSPECTION'),
      ('RawMaterialIntakeStatus', 'ACCEPTED'),
      ('RawMaterialIntakeStatus', 'PARTIALLY_REJECTED'),
      ('RawMaterialIntakeStatus', 'REJECTED'),
      ('RawMaterialIntakeStatus', 'CANCELLED'),
      ('RawMaterialBatchQualityStatus', 'INSPECTION'),
      ('RawMaterialBatchQualityStatus', 'ACCEPTED'),
      ('RawMaterialBatchQualityStatus', 'REJECTED'),
      ('RawMaterialBatchQualityStatus', 'QUARANTINED'),
      ('RawMaterialProcessingStatus', 'PLANNED'),
      ('RawMaterialProcessingStatus', 'RUNNING'),
      ('RawMaterialProcessingStatus', 'COMPLETED'),
      ('RawMaterialProcessingStatus', 'CANCELLED'),
      ('RawMaterialKandangHealthStatus', 'STABLE'),
      ('RawMaterialKandangHealthStatus', 'MONITORING'),
      ('RawMaterialKandangHealthStatus', 'CRITICAL'),
      ('RawMaterialStockMovementType', 'IN'),
      ('RawMaterialStockMovementType', 'OUT'),
      ('RawMaterialStockMovementType', 'ADJUSTMENT'),
      ('RawMaterialStockMovementType', 'TRANSFER_IN'),
      ('RawMaterialStockMovementType', 'TRANSFER_OUT'),
      ('RawMaterialStockMovementType', 'PRODUCTION_USAGE'),
      ('RawMaterialStockMovementType', 'WASTE'),
      ('RawMaterialStockMovementType', 'CORRECTION'),
      ('RawMaterialStockMovementReason', 'PURCHASE'),
      ('RawMaterialStockMovementReason', 'RECEIVING'),
      ('RawMaterialStockMovementReason', 'MANUAL_ADJUSTMENT'),
      ('RawMaterialStockMovementReason', 'STOCK_COUNT'),
      ('RawMaterialStockMovementReason', 'CORRECTION'),
      ('RawMaterialStockMovementReason', 'TRANSFER_IN'),
      ('RawMaterialStockMovementReason', 'TRANSFER_OUT'),
      ('RawMaterialStockMovementReason', 'PRODUCTION_USAGE'),
      ('RawMaterialStockMovementReason', 'WASTE'),
      ('RawMaterialStockMovementReason', 'DAMAGED'),
      ('RawMaterialStockMovementReason', 'EXPIRED'),
      ('RawMaterialStockMovementReason', 'RETURN'),
      ('RawMaterialStockMovementSource', 'MANUAL'),
      ('RawMaterialStockMovementSource', 'INTAKE'),
      ('RawMaterialStockMovementSource', 'BATCH'),
      ('RawMaterialStockMovementSource', 'PROCESSING_RUN'),
      ('RawMaterialStockMovementSource', 'TRANSFER'),
      ('RawMaterialStockMovementSource', 'STOCK_COUNT'),
      ('RawMaterialStockMovementSource', 'SYSTEM')
  ) AS required(type_name, enum_value)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_type type
    JOIN pg_enum enum_value ON enum_value.enumtypid = type.oid
    WHERE type.typname = required.type_name
      AND enum_value.enumlabel = required.enum_value
  );

  IF missing_enum_values IS NOT NULL THEN
    RAISE EXCEPTION
      'Raw Material scoped database setup found missing enum value(s): %.',
      missing_enum_values;
  END IF;
END $$;
