CREATE TYPE "OpsPlaneLevel" AS ENUM ('ROOT', 'FINANCE', 'SUPPORT');
CREATE TYPE "OpsPlaneState" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED');
CREATE TYPE "OpsPlaneScope" AS ENUM ('GLOBAL', 'TENANT', 'FINANCE', 'SUPPORT', 'SIGNALS');
CREATE TYPE "OpsSignalLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "OpsSignalKind" AS ENUM ('TENANT_VIEW', 'USER_VIEW', 'FINANCE_VIEW', 'CASE_VIEW', 'CASE_UPDATE', 'POLICY_VIEW', 'QUEUE_CREATE', 'QUEUE_CLOSE', 'EXPORT_VIEW');
CREATE TYPE "OpsQueueKind" AS ENUM ('TENANT_PAUSE', 'TENANT_RESUME', 'ACCESS_CHANGE', 'OWNER_HELP', 'FINANCE_REVIEW', 'FEATURE_CHANGE', 'EXPORT_VIEW');
CREATE TYPE "OpsQueueState" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CLOSED', 'NEEDS_REVISION');
CREATE TYPE "OpsCaseCategory" AS ENUM ('LOGIN_ACCESS', 'FINANCE_HELP', 'BUG_REPORT', 'DATA_ISSUE', 'FEATURE_HELP', 'TENANT_HEALTH');
CREATE TYPE "OpsCasePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "OpsCaseState" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_TENANT', 'ESCALATED', 'RESOLVED', 'CLOSED');
CREATE TYPE "OpsLedgerState" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'PAUSED', 'CANCELLED');

CREATE TABLE "OpsPlaneProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "level" "OpsPlaneLevel" NOT NULL,
  "state" "OpsPlaneState" NOT NULL DEFAULT 'ACTIVE',
  "label" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OpsPlaneProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpsPlaneScopeLink" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "scope" "OpsPlaneScope" NOT NULL,
  "viewUsers" BOOLEAN NOT NULL DEFAULT false,
  "viewLedger" BOOLEAN NOT NULL DEFAULT false,
  "viewCases" BOOLEAN NOT NULL DEFAULT false,
  "viewSignals" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OpsPlaneScopeLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpsPlaneSignal" (
  "id" TEXT NOT NULL,
  "makerUserId" TEXT NOT NULL,
  "makerLevel" "OpsPlaneLevel" NOT NULL,
  "businessId" TEXT,
  "targetUserId" TEXT,
  "kind" "OpsSignalKind" NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "level" "OpsSignalLevel" NOT NULL DEFAULT 'MEDIUM',
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OpsPlaneSignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpsPlaneQueueItem" (
  "id" TEXT NOT NULL,
  "makerUserId" TEXT NOT NULL,
  "handlerUserId" TEXT,
  "businessId" TEXT,
  "targetUserId" TEXT,
  "kind" "OpsQueueKind" NOT NULL,
  "state" "OpsQueueState" NOT NULL DEFAULT 'PENDING',
  "level" "OpsSignalLevel" NOT NULL DEFAULT 'HIGH',
  "note" TEXT NOT NULL,
  "undoNote" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OpsPlaneQueueItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpsPlaneCaseItem" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "openerId" TEXT,
  "ownerId" TEXT,
  "category" "OpsCaseCategory" NOT NULL,
  "priority" "OpsCasePriority" NOT NULL DEFAULT 'NORMAL',
  "state" "OpsCaseState" NOT NULL DEFAULT 'OPEN',
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "result" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "closedAt" TIMESTAMP(3),
  CONSTRAINT "OpsPlaneCaseItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpsPlaneLedgerSnapshot" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "planKey" TEXT NOT NULL,
  "state" "OpsLedgerState" NOT NULL DEFAULT 'TRIAL',
  "mrr" INTEGER NOT NULL DEFAULT 0,
  "dueAmount" INTEGER NOT NULL DEFAULT 0,
  "dueDays" INTEGER NOT NULL DEFAULT 0,
  "provider" TEXT NOT NULL DEFAULT 'manual',
  "providerRef" TEXT,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OpsPlaneLedgerSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OpsPlaneProfile_userId_key" ON "OpsPlaneProfile"("userId");
CREATE INDEX "OpsPlaneProfile_level_idx" ON "OpsPlaneProfile"("level");
CREATE INDEX "OpsPlaneProfile_state_idx" ON "OpsPlaneProfile"("state");

CREATE UNIQUE INDEX "OpsPlaneScopeLink_profileId_businessId_scope_key" ON "OpsPlaneScopeLink"("profileId", "businessId", "scope");
CREATE INDEX "OpsPlaneScopeLink_profileId_idx" ON "OpsPlaneScopeLink"("profileId");
CREATE INDEX "OpsPlaneScopeLink_businessId_idx" ON "OpsPlaneScopeLink"("businessId");
CREATE INDEX "OpsPlaneScopeLink_scope_idx" ON "OpsPlaneScopeLink"("scope");

CREATE INDEX "OpsPlaneSignal_makerUserId_idx" ON "OpsPlaneSignal"("makerUserId");
CREATE INDEX "OpsPlaneSignal_makerLevel_idx" ON "OpsPlaneSignal"("makerLevel");
CREATE INDEX "OpsPlaneSignal_businessId_idx" ON "OpsPlaneSignal"("businessId");
CREATE INDEX "OpsPlaneSignal_targetUserId_idx" ON "OpsPlaneSignal"("targetUserId");
CREATE INDEX "OpsPlaneSignal_kind_idx" ON "OpsPlaneSignal"("kind");
CREATE INDEX "OpsPlaneSignal_level_idx" ON "OpsPlaneSignal"("level");
CREATE INDEX "OpsPlaneSignal_createdAt_idx" ON "OpsPlaneSignal"("createdAt");

CREATE INDEX "OpsPlaneQueueItem_makerUserId_idx" ON "OpsPlaneQueueItem"("makerUserId");
CREATE INDEX "OpsPlaneQueueItem_handlerUserId_idx" ON "OpsPlaneQueueItem"("handlerUserId");
CREATE INDEX "OpsPlaneQueueItem_businessId_idx" ON "OpsPlaneQueueItem"("businessId");
CREATE INDEX "OpsPlaneQueueItem_targetUserId_idx" ON "OpsPlaneQueueItem"("targetUserId");
CREATE INDEX "OpsPlaneQueueItem_kind_idx" ON "OpsPlaneQueueItem"("kind");
CREATE INDEX "OpsPlaneQueueItem_state_idx" ON "OpsPlaneQueueItem"("state");
CREATE INDEX "OpsPlaneQueueItem_level_idx" ON "OpsPlaneQueueItem"("level");
CREATE INDEX "OpsPlaneQueueItem_createdAt_idx" ON "OpsPlaneQueueItem"("createdAt");

CREATE INDEX "OpsPlaneCaseItem_businessId_idx" ON "OpsPlaneCaseItem"("businessId");
CREATE INDEX "OpsPlaneCaseItem_openerId_idx" ON "OpsPlaneCaseItem"("openerId");
CREATE INDEX "OpsPlaneCaseItem_ownerId_idx" ON "OpsPlaneCaseItem"("ownerId");
CREATE INDEX "OpsPlaneCaseItem_category_idx" ON "OpsPlaneCaseItem"("category");
CREATE INDEX "OpsPlaneCaseItem_priority_idx" ON "OpsPlaneCaseItem"("priority");
CREATE INDEX "OpsPlaneCaseItem_state_idx" ON "OpsPlaneCaseItem"("state");
CREATE INDEX "OpsPlaneCaseItem_createdAt_idx" ON "OpsPlaneCaseItem"("createdAt");

CREATE UNIQUE INDEX "OpsPlaneLedgerSnapshot_businessId_key" ON "OpsPlaneLedgerSnapshot"("businessId");
CREATE INDEX "OpsPlaneLedgerSnapshot_state_idx" ON "OpsPlaneLedgerSnapshot"("state");
CREATE INDEX "OpsPlaneLedgerSnapshot_planKey_idx" ON "OpsPlaneLedgerSnapshot"("planKey");
CREATE INDEX "OpsPlaneLedgerSnapshot_lastSyncedAt_idx" ON "OpsPlaneLedgerSnapshot"("lastSyncedAt");

ALTER TABLE "OpsPlaneProfile" ADD CONSTRAINT "OpsPlaneProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpsPlaneScopeLink" ADD CONSTRAINT "OpsPlaneScopeLink_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "OpsPlaneProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpsPlaneScopeLink" ADD CONSTRAINT "OpsPlaneScopeLink_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpsPlaneSignal" ADD CONSTRAINT "OpsPlaneSignal_makerUserId_fkey" FOREIGN KEY ("makerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsPlaneSignal" ADD CONSTRAINT "OpsPlaneSignal_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpsPlaneSignal" ADD CONSTRAINT "OpsPlaneSignal_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpsPlaneQueueItem" ADD CONSTRAINT "OpsPlaneQueueItem_makerUserId_fkey" FOREIGN KEY ("makerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsPlaneQueueItem" ADD CONSTRAINT "OpsPlaneQueueItem_handlerUserId_fkey" FOREIGN KEY ("handlerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpsPlaneQueueItem" ADD CONSTRAINT "OpsPlaneQueueItem_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpsPlaneQueueItem" ADD CONSTRAINT "OpsPlaneQueueItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpsPlaneCaseItem" ADD CONSTRAINT "OpsPlaneCaseItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpsPlaneCaseItem" ADD CONSTRAINT "OpsPlaneCaseItem_openerId_fkey" FOREIGN KEY ("openerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpsPlaneCaseItem" ADD CONSTRAINT "OpsPlaneCaseItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpsPlaneLedgerSnapshot" ADD CONSTRAINT "OpsPlaneLedgerSnapshot_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
