import "./sync-retail-prisma-schema.ts";

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, "../prisma/schema.prisma");

const RETURN_USER_RELATIONS = `  retailReturns            RetailReturn[]            @relation("RetailReturnCreator")`;
const RETURN_BUSINESS_RELATIONS = `  retailReturns               RetailReturn[]`;
const RETURN_PRODUCT_RELATIONS = `  returnItems    RetailReturnItem[]`;
const RETURN_SALE_RELATIONS = `  returns   RetailReturn[]`;
const RETURN_SALE_ITEM_RELATIONS = `  returnItems RetailReturnItem[]`;

const RETURN_MODELS = `model RetailReturn {
  id                    String   @id @default(cuid())
  businessId            String
  saleId                String
  createdById           String
  returnNumber          String
  originalReceiptNumber String
  reason                String
  status                String   @default("completed")
  refundAmount          Int      @default(0)
  restockedQuantity     Int      @default(0)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  business  Business           @relation(fields: [businessId], references: [id], onDelete: Cascade)
  sale      RetailSale         @relation(fields: [saleId], references: [id], onDelete: Cascade)
  createdBy User               @relation("RetailReturnCreator", fields: [createdById], references: [id])
  items     RetailReturnItem[]

  @@unique([businessId, returnNumber])
  @@index([businessId])
  @@index([saleId])
  @@index([createdById])
  @@index([reason])
  @@index([status])
  @@index([createdAt])
}

model RetailReturnItem {
  id                String   @id @default(cuid())
  returnId          String
  saleItemId        String
  productId         String
  skuSnapshot       String
  nameSnapshot      String
  quantity          Int
  unitPrice         Int
  refundAmount      Int      @default(0)
  restockable       Boolean  @default(false)
  restockedQuantity Int      @default(0)
  createdAt         DateTime @default(now())

  return  RetailReturn   @relation(fields: [returnId], references: [id], onDelete: Cascade)
  saleItem RetailSaleItem @relation(fields: [saleItemId], references: [id])
  product  RetailProduct  @relation(fields: [productId], references: [id])

  @@index([returnId])
  @@index([saleItemId])
  @@index([productId])
  @@index([restockable])
}`;

function insertRelations(modelBlock: string, relations: string) {
  if (modelBlock.includes(relations.split("\n")[0].trim())) {
    return modelBlock;
  }

  const firstBlockAttributeIndex = modelBlock.search(/\n\s*@@/);

  if (firstBlockAttributeIndex >= 0) {
    return `${modelBlock.slice(0, firstBlockAttributeIndex)}\n${relations}\n${modelBlock.slice(firstBlockAttributeIndex)}`;
  }

  return modelBlock.replace(/\n}/, `\n${relations}\n}`);
}

function patchModel(schema: string, modelName: string, relations: string) {
  const modelPattern = new RegExp(`model ${modelName} \\{[\\s\\S]*?\\n\\}`);
  const modelMatch = schema.match(modelPattern);

  if (!modelMatch) {
    throw new Error(`Could not find model ${modelName} in schema.prisma. The base Retail schema sync should have created it first.`);
  }

  const patchedModel = insertRelations(modelMatch[0], relations);
  return schema.replace(modelMatch[0], patchedModel);
}

function patchReturnModels(schema: string) {
  if (schema.includes("model RetailReturn")) {
    return schema;
  }

  if (!schema.includes("model RetailStockMovement")) {
    throw new Error("Could not find RetailStockMovement insertion point. Run the base Retail schema sync first.");
  }

  return schema.replace("model RetailStockMovement", `${RETURN_MODELS}\n\nmodel RetailStockMovement`);
}

let schema = await readFile(schemaPath, "utf8");
schema = patchModel(schema, "User", RETURN_USER_RELATIONS);
schema = patchModel(schema, "Business", RETURN_BUSINESS_RELATIONS);
schema = patchModel(schema, "RetailProduct", RETURN_PRODUCT_RELATIONS);
schema = patchModel(schema, "RetailSale", RETURN_SALE_RELATIONS);
schema = patchModel(schema, "RetailSaleItem", RETURN_SALE_ITEM_RELATIONS);
schema = patchReturnModels(schema);
await writeFile(schemaPath, schema);

console.log("Retail return Prisma schema models and relations are synced.");
console.log("Next: pnpm --filter @workspace/api-server run generate");