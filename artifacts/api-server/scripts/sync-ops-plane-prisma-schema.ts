import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, "../prisma/schema.prisma");

const USER_LINKS = `  opsPlaneProfile       OpsPlaneProfile?
  opsPlaneSignalsMade   OpsPlaneSignal[]    @relation("OpsPlaneSignalMaker")
  opsPlaneSignalsTarget OpsPlaneSignal[]    @relation("OpsPlaneSignalTarget")
  opsPlaneQueueMade     OpsPlaneQueueItem[] @relation("OpsPlaneQueueMaker")
  opsPlaneQueueHandled  OpsPlaneQueueItem[] @relation("OpsPlaneQueueHandler")
  opsPlaneQueueTarget   OpsPlaneQueueItem[] @relation("OpsPlaneQueueTarget")
  opsPlaneCasesOpened   OpsPlaneCaseItem[]  @relation("OpsPlaneCaseOpener")
  opsPlaneCasesOwned    OpsPlaneCaseItem[]  @relation("OpsPlaneCaseOwner")`;

const BUSINESS_LINKS = `  opsPlaneScopeLinks     OpsPlaneScopeLink[]
  opsPlaneSignals        OpsPlaneSignal[]
  opsPlaneQueueItems     OpsPlaneQueueItem[]
  opsPlaneCaseItems      OpsPlaneCaseItem[]
  opsPlaneLedgerSnapshot OpsPlaneLedgerSnapshot?`;

const MODELS = `model OpsPlaneProfile {
  id          String         @id @default(cuid())
  userId      String         @unique
  level       OpsPlaneLevel
  state       OpsPlaneState  @default(ACTIVE)
  label       String?
  note        String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  user       User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  scopeLinks OpsPlaneScopeLink[]

  @@index([level])
  @@index([state])
}

model OpsPlaneScopeLink {
  id           String        @id @default(cuid())
  profileId    String
  businessId    String
  scope        OpsPlaneScope
  viewUsers    Boolean       @default(false)
  viewLedger   Boolean       @default(false)
  viewCases    Boolean       @default(false)
  viewSignals  Boolean       @default(false)
  createdAt    DateTime      @default(now())

  profile  OpsPlaneProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  business Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@unique([profileId, businessId, scope])
  @@index([profileId])
  @@index([businessId])
  @@index([scope])
}

model OpsPlaneSignal {
  id           String         @id @default(cuid())
  makerUserId  String
  makerLevel   OpsPlaneLevel
  businessId   String?
  targetUserId String?
  kind         OpsSignalKind
  targetType   String
  targetId     String?
  level        OpsSignalLevel @default(MEDIUM)
  note         String?
  metadata     Json?
  createdAt    DateTime       @default(now())

  maker      User      @relation("OpsPlaneSignalMaker", fields: [makerUserId], references: [id])
  targetUser User?     @relation("OpsPlaneSignalTarget", fields: [targetUserId], references: [id])
  business   Business? @relation(fields: [businessId], references: [id], onDelete: SetNull)

  @@index([makerUserId])
  @@index([makerLevel])
  @@index([businessId])
  @@index([targetUserId])
  @@index([kind])
  @@index([level])
  @@index([createdAt])
}

model OpsPlaneQueueItem {
  id           String        @id @default(cuid())
  makerUserId  String
  handlerUserId String?
  businessId   String?
  targetUserId String?
  kind         OpsQueueKind
  state        OpsQueueState @default(PENDING)
  level        OpsSignalLevel @default(HIGH)
  note         String
  undoNote     String
  expiresAt    DateTime?
  closedAt     DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  maker      User      @relation("OpsPlaneQueueMaker", fields: [makerUserId], references: [id])
  handler    User?     @relation("OpsPlaneQueueHandler", fields: [handlerUserId], references: [id])
  targetUser User?     @relation("OpsPlaneQueueTarget", fields: [targetUserId], references: [id])
  business   Business? @relation(fields: [businessId], references: [id], onDelete: SetNull)

  @@index([makerUserId])
  @@index([handlerUserId])
  @@index([businessId])
  @@index([targetUserId])
  @@index([kind])
  @@index([state])
  @@index([level])
  @@index([createdAt])
}

model OpsPlaneCaseItem {
  id          String          @id @default(cuid())
  businessId  String
  openerId    String?
  ownerId     String?
  category    OpsCaseCategory
  priority    OpsCasePriority @default(NORMAL)
  state       OpsCaseState    @default(OPEN)
  title       String
  summary     String?
  result      String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  closedAt    DateTime?

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  opener   User?    @relation("OpsPlaneCaseOpener", fields: [openerId], references: [id])
  owner    User?    @relation("OpsPlaneCaseOwner", fields: [ownerId], references: [id])

  @@index([businessId])
  @@index([openerId])
  @@index([ownerId])
  @@index([category])
  @@index([priority])
  @@index([state])
  @@index([createdAt])
}

model OpsPlaneLedgerSnapshot {
  id            String          @id @default(cuid())
  businessId    String          @unique
  planKey       String
  state         OpsLedgerState  @default(TRIAL)
  mrr           Int             @default(0)
  dueAmount     Int             @default(0)
  dueDays       Int             @default(0)
  provider      String          @default("manual")
  providerRef   String?
  lastSyncedAt  DateTime?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([state])
  @@index([planKey])
  @@index([lastSyncedAt])
}`;

const ENUMS = `enum OpsPlaneLevel {
  ROOT
  FINANCE
  SUPPORT
}

enum OpsPlaneState {
  ACTIVE
  PAUSED
  CLOSED
}

enum OpsPlaneScope {
  GLOBAL
  TENANT
  FINANCE
  SUPPORT
  SIGNALS
}

enum OpsSignalLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum OpsSignalKind {
  TENANT_VIEW
  USER_VIEW
  FINANCE_VIEW
  CASE_VIEW
  CASE_UPDATE
  POLICY_VIEW
  QUEUE_CREATE
  QUEUE_CLOSE
  EXPORT_VIEW
}

enum OpsQueueKind {
  TENANT_PAUSE
  TENANT_RESUME
  ACCESS_CHANGE
  OWNER_HELP
  FINANCE_REVIEW
  FEATURE_CHANGE
  EXPORT_VIEW
}

enum OpsQueueState {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
  CLOSED
  NEEDS_REVISION
}

enum OpsCaseCategory {
  LOGIN_ACCESS
  FINANCE_HELP
  BUG_REPORT
  DATA_ISSUE
  FEATURE_HELP
  TENANT_HEALTH
}

enum OpsCasePriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum OpsCaseState {
  OPEN
  IN_PROGRESS
  WAITING_TENANT
  ESCALATED
  RESOLVED
  CLOSED
}

enum OpsLedgerState {
  TRIAL
  ACTIVE
  PAST_DUE
  PAUSED
  CANCELLED
}`;

function insertRelations(modelBlock: string, relations: string) {
  const firstRelation = relations.split("\n")[0]?.trim();
  if (firstRelation && modelBlock.includes(firstRelation)) return modelBlock;
  const firstBlockAttributeIndex = modelBlock.search(/\n\s*@@/);
  if (firstBlockAttributeIndex >= 0) {
    return `${modelBlock.slice(0, firstBlockAttributeIndex)}\n${relations}\n${modelBlock.slice(firstBlockAttributeIndex)}`;
  }
  return modelBlock.replace(/\n}/, `\n${relations}\n}`);
}

function patchModel(schema: string, modelName: string, relations: string) {
  const modelPattern = new RegExp(`model ${modelName} \\{[\\s\\S]*?\\n\\}`);
  const match = schema.match(modelPattern);
  if (!match) throw new Error(`Could not find model ${modelName}.`);
  return schema.replace(match[0], insertRelations(match[0], relations));
}

function patchModels(schema: string) {
  if (schema.includes("model OpsPlaneProfile")) return schema;
  if (!schema.includes("model Permission")) throw new Error("Could not find insertion point before model Permission.");
  return schema.replace("model Permission", `${MODELS}\n\nmodel Permission`);
}

function patchEnums(schema: string) {
  if (schema.includes("enum OpsPlaneLevel")) return schema;
  if (!schema.includes("enum Role")) throw new Error("Could not find insertion point before enum Role.");
  return schema.replace("enum Role", `${ENUMS}\n\nenum Role`);
}

let schema = await readFile(schemaPath, "utf8");
schema = patchModel(schema, "User", USER_LINKS);
schema = patchModel(schema, "Business", BUSINESS_LINKS);
schema = patchModels(schema);
schema = patchEnums(schema);
await writeFile(schemaPath, schema);

console.log("Ops Plane Prisma schema foundation is synced.");
console.log("Next: pnpm --filter @workspace/api-server run generate");
