-- Verification for scoped Service Business database setup.
-- This intentionally checks only Service Business tables, columns, and enum values.

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
      ('service_requests'),
      ('service_jobs'),
      ('service_cost_lines'),
      ('service_quotations'),
      ('service_invoices'),
      ('service_checklist_items'),
      ('service_timeline_items')
  ) AS required(table_name)
  WHERE TO_REGCLASS(FORMAT('public.%I', required.table_name)) IS NULL;

  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION
      'Service Business scoped schema verification failed. Missing table(s): %',
      missing_tables;
  END IF;

  SELECT ARRAY_AGG(required.table_name || '.' || required.column_name)
  INTO missing_columns
  FROM (
    VALUES
      ('service_requests', 'id'),
      ('service_requests', 'business_id'),
      ('service_requests', 'request_code'),
      ('service_requests', 'customer_name'),
      ('service_requests', 'service_category'),
      ('service_requests', 'title'),
      ('service_requests', 'status'),
      ('service_requests', 'priority'),
      ('service_jobs', 'id'),
      ('service_jobs', 'request_id'),
      ('service_jobs', 'title'),
      ('service_jobs', 'status'),
      ('service_cost_lines', 'id'),
      ('service_cost_lines', 'job_id'),
      ('service_cost_lines', 'label'),
      ('service_cost_lines', 'category'),
      ('service_cost_lines', 'quantity'),
      ('service_cost_lines', 'unit_cost'),
      ('service_quotations', 'id'),
      ('service_quotations', 'request_id'),
      ('service_quotations', 'quotation_code'),
      ('service_quotations', 'status'),
      ('service_quotations', 'total'),
      ('service_invoices', 'id'),
      ('service_invoices', 'request_id'),
      ('service_invoices', 'invoice_code'),
      ('service_invoices', 'status'),
      ('service_invoices', 'total'),
      ('service_invoices', 'paid_amount'),
      ('service_checklist_items', 'id'),
      ('service_checklist_items', 'job_id'),
      ('service_checklist_items', 'label'),
      ('service_checklist_items', 'is_done'),
      ('service_timeline_items', 'id'),
      ('service_timeline_items', 'request_id'),
      ('service_timeline_items', 'label'),
      ('service_timeline_items', 'actor_name')
  ) AS required(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = required.table_name
      AND column_name = required.column_name
  );

  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION
      'Service Business scoped schema verification failed. Missing column(s): %',
      missing_columns;
  END IF;

  SELECT ARRAY_AGG(required.type_name || '.' || required.enum_value)
  INTO missing_enum_values
  FROM (
    VALUES
      ('service_business_workflow_status', 'REQUEST_INTAKE'),
      ('service_business_workflow_status', 'JOB_PLANNING'),
      ('service_business_workflow_status', 'QUOTATION_DRAFT'),
      ('service_business_workflow_status', 'QUOTATION_APPROVED'),
      ('service_business_workflow_status', 'IN_PROGRESS'),
      ('service_business_workflow_status', 'READY_FOR_REVIEW'),
      ('service_business_workflow_status', 'DELIVERED'),
      ('service_business_workflow_status', 'INVOICED'),
      ('service_business_workflow_status', 'PAID'),
      ('service_business_workflow_status', 'CLOSED'),
      ('service_business_workflow_status', 'CANCELLED'),
      ('service_business_workflow_status', 'REJECTED'),
      ('service_business_priority', 'LOW'),
      ('service_business_priority', 'NORMAL'),
      ('service_business_priority', 'HIGH'),
      ('service_business_priority', 'URGENT'),
      ('service_business_cost_category', 'labor'),
      ('service_business_cost_category', 'material'),
      ('service_business_cost_category', 'operational'),
      ('service_business_cost_category', 'vendor'),
      ('service_business_quote_status', 'draft'),
      ('service_business_quote_status', 'sent'),
      ('service_business_quote_status', 'approved'),
      ('service_business_quote_status', 'rejected'),
      ('service_business_quote_status', 'expired'),
      ('service_business_invoice_status', 'draft'),
      ('service_business_invoice_status', 'issued'),
      ('service_business_invoice_status', 'partial'),
      ('service_business_invoice_status', 'paid'),
      ('service_business_invoice_status', 'overdue'),
      ('service_business_invoice_status', 'cancelled')
  ) AS required(type_name, enum_value)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = required.type_name
      AND e.enumlabel = required.enum_value
  );

  IF missing_enum_values IS NOT NULL THEN
    RAISE EXCEPTION
      'Service Business scoped schema verification failed. Missing enum value(s): %',
      missing_enum_values;
  END IF;
END $$;
