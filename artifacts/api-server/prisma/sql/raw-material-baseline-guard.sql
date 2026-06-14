-- Guard for scoped Raw Material database setup.
-- This file intentionally does not use Prisma migration history.
-- It verifies that shared base tables required by Raw Material workflows exist before Raw Material tables are applied.

DO $$
DECLARE
  missing_base_tables TEXT[];
  missing_base_enums TEXT[];
BEGIN
  SELECT ARRAY_AGG(required.table_name)
  INTO missing_base_tables
  FROM (
    VALUES
      ('Business'),
      ('User'),
      ('AuditLog')
  ) AS required(table_name)
  WHERE TO_REGCLASS(FORMAT('public.%I', required.table_name)) IS NULL;

  IF missing_base_tables IS NOT NULL THEN
    RAISE EXCEPTION
      'Raw Material scoped database setup requires existing base table(s): %. Apply or repair the base app schema before running raw-material:db:apply.',
      missing_base_tables;
  END IF;

  SELECT ARRAY_AGG(required.type_name)
  INTO missing_base_enums
  FROM (
    VALUES
      ('BusinessType'),
      ('BusinessMode')
  ) AS required(type_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = required.type_name
  );

  IF missing_base_enums IS NOT NULL THEN
    RAISE EXCEPTION
      'Raw Material scoped database setup requires existing base enum type(s): %. Apply or repair the base app schema before running raw-material:db:apply.',
      missing_base_enums;
  END IF;
END $$;
