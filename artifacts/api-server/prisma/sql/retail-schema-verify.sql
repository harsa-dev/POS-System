-- Postflight verification for scoped Retail database setup.
-- This fails loudly when a database has partial Retail tables instead of silently accepting drift.

DO $$
DECLARE
  missing_tables TEXT[];
  missing_columns TEXT[];
BEGIN
  SELECT ARRAY_AGG(required.table_name)
  INTO missing_tables
  FROM (
    VALUES
      ('RetailSupplier'),
      ('RetailProduct'),
      ('RetailReceiving'),
      ('RetailReceivingItem'),
      ('RetailSale'),
      ('RetailSaleItem'),
      ('RetailPayment'),
      ('RetailStockMovement'),
      ('RetailReturn'),
      ('RetailReturnItem')
  ) AS required(table_name)
  WHERE TO_REGCLASS(FORMAT('public.%I', required.table_name)) IS NULL;

  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION
      'Retail scoped database setup failed. Missing Retail table(s): %.',
      missing_tables;
  END IF;

  SELECT ARRAY_AGG(required.table_name || '.' || required.column_name)
  INTO missing_columns
  FROM (
    VALUES
      ('RetailSupplier', 'id'),
      ('RetailSupplier', 'businessId'),
      ('RetailSupplier', 'name'),
      ('RetailProduct', 'id'),
      ('RetailProduct', 'businessId'),
      ('RetailProduct', 'sku'),
      ('RetailProduct', 'barcode'),
      ('RetailProduct', 'currentStock'),
      ('RetailReceiving', 'id'),
      ('RetailReceiving', 'businessId'),
      ('RetailReceiving', 'supplierId'),
      ('RetailReceiving', 'status'),
      ('RetailReceivingItem', 'id'),
      ('RetailReceivingItem', 'receivingId'),
      ('RetailReceivingItem', 'productId'),
      ('RetailSale', 'id'),
      ('RetailSale', 'businessId'),
      ('RetailSale', 'receiptNumber'),
      ('RetailSale', 'status'),
      ('RetailSaleItem', 'id'),
      ('RetailSaleItem', 'saleId'),
      ('RetailSaleItem', 'productId'),
      ('RetailPayment', 'id'),
      ('RetailPayment', 'saleId'),
      ('RetailPayment', 'status'),
      ('RetailStockMovement', 'id'),
      ('RetailStockMovement', 'businessId'),
      ('RetailStockMovement', 'productId'),
      ('RetailStockMovement', 'source'),
      ('RetailReturn', 'id'),
      ('RetailReturn', 'businessId'),
      ('RetailReturn', 'saleId'),
      ('RetailReturn', 'returnNumber'),
      ('RetailReturnItem', 'id'),
      ('RetailReturnItem', 'returnId'),
      ('RetailReturnItem', 'saleItemId'),
      ('RetailReturnItem', 'productId')
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
      'Retail scoped database setup found partial or drifted Retail table(s). Missing required column(s): %.',
      missing_columns;
  END IF;
END $$;
