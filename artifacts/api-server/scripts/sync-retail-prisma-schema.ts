import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, "../prisma/schema.prisma");

const RETAIL_USER_RELATIONS = `  retailSales              RetailSale[]              @relation("RetailSaleCreator")
  retailStockMovements     RetailStockMovement[]     @relation("RetailStockMovementActor")`;

const RETAIL_BUSINESS_RELATIONS = `  retailSuppliers             RetailSupplier[]
  retailProducts              RetailProduct[]
  retailReceivings            RetailReceiving[]
  retailSales                 RetailSale[]
  retailStockMovements        RetailStockMovement[]`;

const RETAIL_MODELS = `model RetailSupplier {
  id               String   @id @default(cuid())
  businessId       String
  name             String
  leadTimeDays     Int      @default(0)
  reliabilityScore Int      @default(0)
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  business   Business          @relation(fields: [businessId], references: [id], onDelete: Cascade)
  products   RetailProduct[]
  receivings RetailReceiving[]

  @@unique([businessId, name])
  @@index([businessId])
  @@index([isActive])
}

model RetailProduct {
  id             String   @id @default(cuid())
  businessId     String
  supplierId     String?
  sku            String
  barcode        String
  name           String
  brand          String   @default("")
  category       String   @default("general")
  unit           String   @default("pcs")
  price          Int      @default(0)
  cost           Int      @default(0)
  taxRatePercent Int      @default(0)
  currentStock   Int      @default(0)
  reorderPoint   Int      @default(0)
  shelfLocation  String   @default("")
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  business       Business                  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  supplier       RetailSupplier?           @relation(fields: [supplierId], references: [id], onDelete: SetNull)
  receivingItems RetailReceivingItem[]
  saleItems      RetailSaleItem[]
  stockMovements RetailStockMovement[]

  @@unique([businessId, sku])
  @@unique([businessId, barcode])
  @@index([businessId])
  @@index([supplierId])
  @@index([category])
  @@index([currentStock])
  @@index([reorderPoint])
  @@index([isActive])
}

model RetailReceiving {
  id              String   @id @default(cuid())
  businessId      String
  supplierId      String
  referenceNumber String
  status          String   @default("ordered")
  expectedDate    DateTime
  receivedAt      DateTime?
  totalCost       Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  business Business              @relation(fields: [businessId], references: [id], onDelete: Cascade)
  supplier RetailSupplier        @relation(fields: [supplierId], references: [id])
  items    RetailReceivingItem[]

  @@unique([businessId, referenceNumber])
  @@index([businessId])
  @@index([supplierId])
  @@index([status])
  @@index([expectedDate])
}

model RetailReceivingItem {
  id          String @id @default(cuid())
  receivingId String
  productId   String
  orderedQty  Int    @default(0)
  receivedQty Int    @default(0)
  unitCost    Int    @default(0)

  receiving RetailReceiving @relation(fields: [receivingId], references: [id], onDelete: Cascade)
  product   RetailProduct   @relation(fields: [productId], references: [id])

  @@index([receivingId])
  @@index([productId])
}

model RetailSale {
  id            String   @id @default(cuid())
  businessId    String
  createdById   String
  receiptNumber String
  paymentMethod String
  subtotal      Int      @default(0)
  discountTotal Int      @default(0)
  taxIncluded   Int      @default(0)
  total         Int      @default(0)
  grossProfit   Int      @default(0)
  status        String   @default("completed")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  business  Business         @relation(fields: [businessId], references: [id], onDelete: Cascade)
  createdBy User             @relation("RetailSaleCreator", fields: [createdById], references: [id])
  items     RetailSaleItem[]
  payment   RetailPayment?

  @@unique([businessId, receiptNumber])
  @@index([businessId])
  @@index([createdById])
  @@index([paymentMethod])
  @@index([status])
  @@index([createdAt])
}

model RetailSaleItem {
  id             String @id @default(cuid())
  saleId         String
  productId      String
  skuSnapshot    String
  nameSnapshot   String
  quantity       Int
  unitPrice      Int
  costSnapshot   Int
  subtotal       Int
  discountAmount Int    @default(0)
  taxIncluded    Int    @default(0)
  lineTotal      Int
  grossProfit    Int    @default(0)

  sale    RetailSale    @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product RetailProduct @relation(fields: [productId], references: [id])

  @@index([saleId])
  @@index([productId])
}

model RetailPayment {
  id        String   @id @default(cuid())
  saleId    String   @unique
  provider  String   @default("manual")
  method    String
  status    String   @default("paid")
  amount    Int      @default(0)
  paidAt    DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sale RetailSale @relation(fields: [saleId], references: [id], onDelete: Cascade)

  @@index([method])
  @@index([status])
}

model RetailStockMovement {
  id             String   @id @default(cuid())
  businessId     String
  productId      String
  type           String
  reason         String
  source         String
  sourceId       String?
  quantity       Int
  beforeQuantity Int
  afterQuantity  Int
  note           String?
  createdById    String?
  createdAt      DateTime @default(now())

  business  Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  product   RetailProduct @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdBy User?         @relation("RetailStockMovementActor", fields: [createdById], references: [id])

  @@index([businessId])
  @@index([productId])
  @@index([type])
  @@index([reason])
  @@index([source])
  @@index([createdAt])
}`;

function insertBeforeClosingBrace(modelBlock: string, relations: string) {
  if (modelBlock.includes(relations.split("\n")[0].trim())) {
    return modelBlock;
  }

  return modelBlock.replace(/\n}/, `\n${relations}\n}`);
}

function patchModel(schema: string, modelName: string, relations: string) {
  const modelPattern = new RegExp(`model ${modelName} \\{[\\s\\S]*?\\n\\}`);
  const modelMatch = schema.match(modelPattern);

  if (!modelMatch) {
    throw new Error(`Could not find model ${modelName} in schema.prisma.`);
  }

  const patchedModel = insertBeforeClosingBrace(modelMatch[0], relations);
  return schema.replace(modelMatch[0], patchedModel);
}

function patchRetailModels(schema: string) {
  if (schema.includes("model RetailSupplier")) {
    return schema;
  }

  if (!schema.includes("model RawMaterialSupplier")) {
    throw new Error("Could not find insertion point before model RawMaterialSupplier.");
  }

  return schema.replace("model RawMaterialSupplier", `${RETAIL_MODELS}\n\nmodel RawMaterialSupplier`);
}

let schema = await readFile(schemaPath, "utf8");
schema = patchModel(schema, "User", RETAIL_USER_RELATIONS);
schema = patchModel(schema, "Business", RETAIL_BUSINESS_RELATIONS);
schema = patchRetailModels(schema);
await writeFile(schemaPath, schema);

console.log("Retail Prisma schema models and relations are synced.");
console.log("Next: pnpm --filter @workspace/api-server run generate");
