-- Phase 3A - Internal platform admin persistence foundation
-- This migration creates platform-level admin tables for monitoring tenants and users.
-- It intentionally does not unlock write workflows. Mutation endpoints still need RBAC, audit, approval, rate limit, and rollback rules.

DO $$ BEGIN
  CREATE TYPE "PlatformAdminRole" AS ENUM ('SUPER_ADMIN', 'BILLING_ADMIN', 'SUPPORT_OPS_ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlatformAdminStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlatformAdminTenantScope" AS ENUM ('GLOBAL', 'TENANT_SPECIFIC', 'BILLING_ONLY', 'SUPPORT_ONLY', 'AUDIT_ONLY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlatformAdminRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlatformAdminAuditAction" AS ENUM (
    'TENANT_VIEW',
    'TENANT_STATUS_REVIEW',
    'USER_VIEW',
    'USER_RECOVERY_REVIEW',
    'BILLING_VIEW',
    'BILLING_RISK_REVIEW',
    'SUPPORT_TICKET_VIEW',
    'SUPPORT_TICKET_UPDATE',
    'ROLE_POLICY_VIEW',
    'ROLE_CHANGE_REQUEST',
    'APPROVAL_REQUEST_CREATE',
    'APPROVAL_DECISION',
    'AUDIT_EXPORT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SensitiveActionKey" AS ENUM (
    'TENANT_SUSPEND',
    'TENANT_REACTIVATE',
    'ROLE_ELEVATION',
    'ROLE_REVOKE',
    'OWNER_ACCOUNT_RECOVERY',
    'LARGE_REFUND_REVIEW',
    'FEATURE_FLAG_CHANGE',
    'AUDIT_EXPORT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SensitiveApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'NEEDS_REVISION');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupportTicketCategory" AS ENUM ('LOGIN_ACCESS', 'BILLING_CONFUSION', 'BUG_REPORT', 'DATA_ISSUE', 'FEATURE_HELP', 'TENANT_HEALTH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_TENANT', 'ESCALATED', 'RESOLVED', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BillingAccountStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "PlatformAdminProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "role" "PlatformAdminRole" NOT NULL,
  "status" "PlatformAdminStatus" NOT NULL DEFAULT 'ACTIVE',
  "displayName" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformAdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlatformAdminProfile_userId_key" ON "PlatformAdminProfile"("userId");
CREATE INDEX IF NOT EXISTS "PlatformAdminProfile_role_idx" ON "PlatformAdminProfile"("role");
CREATE INDEX IF NOT EXISTS "PlatformAdminProfile_status_idx" ON "PlatformAdminProfile"("status");

CREATE TABLE IF NOT EXISTS "PlatformAdminTenantAccess" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "adminProfileId" TEXT NOT NULL,
  "businessId" TEXT,
  "scope" "PlatformAdminTenantScope" NOT NULL DEFAULT 'TENANT_SPECIFIC',
  "canViewUsers" BOOLEAN NOT NULL DEFAULT false,
  "canViewBilling" BOOLEAN NOT NULL DEFAULT false,
  "canViewSupport" BOOLEAN NOT NULL DEFAULT false,
  "canViewAudit" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformAdminTenantAccess_adminProfileId_fkey" FOREIGN KEY ("adminProfileId") REFERENCES "PlatformAdminProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PlatformAdminTenantAccess_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlatformAdminTenantAccess_tenant_scope_key" ON "PlatformAdminTenantAccess"("adminProfileId", "businessId", "scope") WHERE "businessId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "PlatformAdminTenantAccess_global_scope_key" ON "PlatformAdminTenantAccess"("adminProfileId", "scope") WHERE "businessId" IS NULL;
CREATE INDEX IF NOT EXISTS "PlatformAdminTenantAccess_adminProfileId_idx" ON "PlatformAdminTenantAccess"("adminProfileId");
CREATE INDEX IF NOT EXISTS "PlatformAdminTenantAccess_businessId_idx" ON "PlatformAdminTenantAccess"("businessId");
CREATE INDEX IF NOT EXISTS "PlatformAdminTenantAccess_scope_idx" ON "PlatformAdminTenantAccess"("scope");

CREATE TABLE IF NOT EXISTS "PlatformAdminAuditEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorUserId" TEXT NOT NULL,
  "actorRole" "PlatformAdminRole" NOT NULL,
  "businessId" TEXT,
  "targetUserId" TEXT,
  "action" "PlatformAdminAuditAction" NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "riskLevel" "PlatformAdminRiskLevel" NOT NULL DEFAULT 'MEDIUM',
  "reason" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformAdminAuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PlatformAdminAuditEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "PlatformAdminAuditEvent_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PlatformAdminAuditEvent_actorUserId_idx" ON "PlatformAdminAuditEvent"("actorUserId");
CREATE INDEX IF NOT EXISTS "PlatformAdminAuditEvent_actorRole_idx" ON "PlatformAdminAuditEvent"("actorRole");
CREATE INDEX IF NOT EXISTS "PlatformAdminAuditEvent_businessId_idx" ON "PlatformAdminAuditEvent"("businessId");
CREATE INDEX IF NOT EXISTS "PlatformAdminAuditEvent_targetUserId_idx" ON "PlatformAdminAuditEvent"("targetUserId");
CREATE INDEX IF NOT EXISTS "PlatformAdminAuditEvent_action_idx" ON "PlatformAdminAuditEvent"("action");
CREATE INDEX IF NOT EXISTS "PlatformAdminAuditEvent_riskLevel_idx" ON "PlatformAdminAuditEvent"("riskLevel");
CREATE INDEX IF NOT EXISTS "PlatformAdminAuditEvent_createdAt_idx" ON "PlatformAdminAuditEvent"("createdAt");

CREATE TABLE IF NOT EXISTS "SensitiveActionApproval" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requestedById" TEXT NOT NULL,
  "reviewedById" TEXT,
  "businessId" TEXT,
  "targetUserId" TEXT,
  "actionKey" "SensitiveActionKey" NOT NULL,
  "status" "SensitiveApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "riskLevel" "PlatformAdminRiskLevel" NOT NULL DEFAULT 'HIGH',
  "reason" TEXT NOT NULL,
  "rollbackPlan" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SensitiveActionApproval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SensitiveActionApproval_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SensitiveActionApproval_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SensitiveActionApproval_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SensitiveActionApproval_requestedById_idx" ON "SensitiveActionApproval"("requestedById");
CREATE INDEX IF NOT EXISTS "SensitiveActionApproval_reviewedById_idx" ON "SensitiveActionApproval"("reviewedById");
CREATE INDEX IF NOT EXISTS "SensitiveActionApproval_businessId_idx" ON "SensitiveActionApproval"("businessId");
CREATE INDEX IF NOT EXISTS "SensitiveActionApproval_targetUserId_idx" ON "SensitiveActionApproval"("targetUserId");
CREATE INDEX IF NOT EXISTS "SensitiveActionApproval_actionKey_idx" ON "SensitiveActionApproval"("actionKey");
CREATE INDEX IF NOT EXISTS "SensitiveActionApproval_status_idx" ON "SensitiveActionApproval"("status");
CREATE INDEX IF NOT EXISTS "SensitiveActionApproval_riskLevel_idx" ON "SensitiveActionApproval"("riskLevel");
CREATE INDEX IF NOT EXISTS "SensitiveActionApproval_createdAt_idx" ON "SensitiveActionApproval"("createdAt");

CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  "requesterId" TEXT,
  "assignedToId" TEXT,
  "category" "SupportTicketCategory" NOT NULL,
  "priority" "SupportTicketPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "resolution" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  CONSTRAINT "SupportTicket_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SupportTicket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SupportTicket_businessId_idx" ON "SupportTicket"("businessId");
CREATE INDEX IF NOT EXISTS "SupportTicket_requesterId_idx" ON "SupportTicket"("requesterId");
CREATE INDEX IF NOT EXISTS "SupportTicket_assignedToId_idx" ON "SupportTicket"("assignedToId");
CREATE INDEX IF NOT EXISTS "SupportTicket_category_idx" ON "SupportTicket"("category");
CREATE INDEX IF NOT EXISTS "SupportTicket_priority_idx" ON "SupportTicket"("priority");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

CREATE TABLE IF NOT EXISTS "BillingAccountSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  "planKey" TEXT NOT NULL,
  "billingStatus" "BillingAccountStatus" NOT NULL DEFAULT 'TRIAL',
  "mrr" INTEGER NOT NULL DEFAULT 0,
  "overdueAmount" INTEGER NOT NULL DEFAULT 0,
  "overdueDays" INTEGER NOT NULL DEFAULT 0,
  "provider" TEXT NOT NULL DEFAULT 'manual',
  "providerRef" TEXT,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingAccountSnapshot_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "BillingAccountSnapshot_businessId_key" ON "BillingAccountSnapshot"("businessId");
CREATE INDEX IF NOT EXISTS "BillingAccountSnapshot_billingStatus_idx" ON "BillingAccountSnapshot"("billingStatus");
CREATE INDEX IF NOT EXISTS "BillingAccountSnapshot_planKey_idx" ON "BillingAccountSnapshot"("planKey");
CREATE INDEX IF NOT EXISTS "BillingAccountSnapshot_lastSyncedAt_idx" ON "BillingAccountSnapshot"("lastSyncedAt");
