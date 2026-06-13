import type {
  RetailActor,
  RetailBusinessScope,
  RetailInventoryRiskDto,
  RetailPersistedCheckoutDto,
  RetailProductDto,
  RetailReceivingQueueDto,
  RetailSalePreviewDto,
  RetailSupplierDto,
} from "./retail.types.js";

export type RetailCreateSaleInput = {
  scope: RetailBusinessScope;
  actor: RetailActor;
  preview: RetailSalePreviewDto;
};

export type RetailRepository = {
  listProducts(scope: RetailBusinessScope): RetailProductDto[] | Promise<RetailProductDto[]>;
  listSuppliers(scope: RetailBusinessScope): RetailSupplierDto[] | Promise<RetailSupplierDto[]>;
  listReceivingQueue(scope: RetailBusinessScope): RetailReceivingQueueDto[] | Promise<RetailReceivingQueueDto[]>;
  findProductById(scope: RetailBusinessScope, productId: string): RetailProductDto | null | Promise<RetailProductDto | null>;
  findProductByCode(scope: RetailBusinessScope, code: string): RetailProductDto | null | Promise<RetailProductDto | null>;
  getInventoryRisks(scope: RetailBusinessScope): RetailInventoryRiskDto[] | Promise<RetailInventoryRiskDto[]>;
  createSale(input: RetailCreateSaleInput): RetailPersistedCheckoutDto | Promise<RetailPersistedCheckoutDto>;
};
