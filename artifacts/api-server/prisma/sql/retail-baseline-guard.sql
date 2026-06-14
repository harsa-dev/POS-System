-- Guard for scoped Retail database setup.
-- This file intentionally does not use Prisma migration history.
-- It verifies that shared base tables required by Retail workflows exist before Retail tables are applied.

DO $$
DECLARE
  missing_base_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(required.table_name)
  INTO missing_base_tables
  FROM (
    VALUES
      ('Business'),
      ('User'),
      ('CashflowEntry'),
      ('AuditLog')
  ) AS required(table_name)
  WHERE TO_REGCLASS(FORMAT('public.%I', required.table_name)) IS NULL;

  IF missing_base_tables IS NOT NULL THEN
    RAISE EXCEPTION
      'Retail scoped database setup requires existing base table(s): %. Apply or repair the base app schema before running retail:db:apply.',
      missing_base_tables;
  END IF;
END $$;
