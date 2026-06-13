import type {
  RetailInventoryRiskDto,
  RetailProductDto,
  RetailReceivingQueueDto,
  RetailSupplierDto,
} from "./retail.types.js";

export type RetailRepository = {
  listProducts(): RetailProductDto[] | Promise<RetailProductDto[]>;
  listSuppliers(): RetailSupplierDto[] | Promise<RetailSupplierDto[]>;
  listReceivingQueue(): RetailReceivingQueueDto[] | Promise<RetailReceivingQueueDto[]>;
  findProductById(productId: string): RetailProductDto | null | Promise<RetailProductDto | null>;
  findProductByCode(code: string): RetailProductDto | null | Promise<RetailProductDto | null>;
  getInventoryRisks(): RetailInventoryRiskDto[] | Promise<RetailInventoryRiskDto[]>;
};
