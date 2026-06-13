CREATE TYPE service_business_workflow_status AS ENUM (
  'REQUEST_INTAKE',
  'JOB_PLANNING',
  'QUOTATION_DRAFT',
  'QUOTATION_APPROVED',
  'IN_PROGRESS',
  'READY_FOR_REVIEW',
  'DELIVERED',
  'INVOICED',
  'PAID',
  'CLOSED',
  'CANCELLED',
  'REJECTED'
);

CREATE TYPE service_business_priority AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

CREATE TYPE service_business_cost_category AS ENUM (
  'labor',
  'material',
  'operational',
  'vendor'
);

CREATE TYPE service_business_quote_status AS ENUM (
  'draft',
  'sent',
  'approved',
  'rejected',
  'expired'
);

CREATE TYPE service_business_invoice_status AS ENUM (
  'draft',
  'issued',
  'partial',
  'paid',
  'overdue',
  'cancelled'
);

CREATE TABLE service_requests (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  request_code TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_segment TEXT NOT NULL DEFAULT 'General Service',
  service_category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  status service_business_workflow_status NOT NULL DEFAULT 'REQUEST_INTAKE',
  priority service_business_priority NOT NULL DEFAULT 'NORMAL',
  due_date TIMESTAMP(3),
  assigned_to TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (business_id, request_code)
);

CREATE INDEX service_requests_business_id_idx ON service_requests(business_id);
CREATE INDEX service_requests_status_idx ON service_requests(status);
CREATE INDEX service_requests_priority_idx ON service_requests(priority);
CREATE INDEX service_requests_due_date_idx ON service_requests(due_date);
CREATE INDEX service_requests_created_at_idx ON service_requests(created_at);

CREATE TABLE service_jobs (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to TEXT,
  status service_business_workflow_status NOT NULL DEFAULT 'REQUEST_INTAKE',
  started_at TIMESTAMP(3),
  completed_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX service_jobs_request_id_idx ON service_jobs(request_id);
CREATE INDEX service_jobs_status_idx ON service_jobs(status);
CREATE INDEX service_jobs_assigned_to_idx ON service_jobs(assigned_to);
CREATE INDEX service_jobs_created_at_idx ON service_jobs(created_at);

CREATE TABLE service_cost_lines (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES service_jobs(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  category service_business_cost_category NOT NULL,
  quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
  unit_label TEXT NOT NULL DEFAULT 'unit',
  unit_cost INTEGER NOT NULL DEFAULT 0,
  billable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX service_cost_lines_job_id_idx ON service_cost_lines(job_id);
CREATE INDEX service_cost_lines_category_idx ON service_cost_lines(category);
CREATE INDEX service_cost_lines_billable_idx ON service_cost_lines(billable);

CREATE TABLE service_quotations (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES service_jobs(id) ON DELETE SET NULL,
  quotation_code TEXT NOT NULL,
  status service_business_quote_status NOT NULL DEFAULT 'draft',
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  tax_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  margin_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  valid_until TIMESTAMP(3),
  approved_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (request_id, quotation_code)
);

CREATE INDEX service_quotations_request_id_idx ON service_quotations(request_id);
CREATE INDEX service_quotations_job_id_idx ON service_quotations(job_id);
CREATE INDEX service_quotations_status_idx ON service_quotations(status);
CREATE INDEX service_quotations_valid_until_idx ON service_quotations(valid_until);

CREATE TABLE service_invoices (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  quotation_id TEXT REFERENCES service_quotations(id) ON DELETE SET NULL,
  invoice_code TEXT NOT NULL,
  status service_business_invoice_status NOT NULL DEFAULT 'draft',
  total INTEGER NOT NULL DEFAULT 0,
  paid_amount INTEGER NOT NULL DEFAULT 0,
  due_date TIMESTAMP(3),
  issued_at TIMESTAMP(3),
  paid_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (request_id, invoice_code)
);

CREATE INDEX service_invoices_request_id_idx ON service_invoices(request_id);
CREATE INDEX service_invoices_quotation_id_idx ON service_invoices(quotation_id);
CREATE INDEX service_invoices_status_idx ON service_invoices(status);
CREATE INDEX service_invoices_due_date_idx ON service_invoices(due_date);

CREATE TABLE service_checklist_items (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES service_jobs(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX service_checklist_items_job_id_idx ON service_checklist_items(job_id);
CREATE INDEX service_checklist_items_is_done_idx ON service_checklist_items(is_done);

CREATE TABLE service_timeline_items (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  actor_name TEXT NOT NULL DEFAULT 'System',
  occurred_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX service_timeline_items_request_id_idx ON service_timeline_items(request_id);
CREATE INDEX service_timeline_items_occurred_at_idx ON service_timeline_items(occurred_at);
