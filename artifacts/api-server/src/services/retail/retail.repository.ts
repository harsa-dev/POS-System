import type {
  RetailActor,
  RetailBusinessScope,
  RetailInventoryRiskDto,
  RetailPersistedCheckoutDto,
  RetailProductDto,
  RetailPromotionDto,
  RetailReceivingQueueDto,
  RetailSaleDto,
  RetailSalePreviewDto,
  RetailStockAdjustInput,
  RetailStockAdjustResultDto,
  RetailStockMovementDto,
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
  listSales(scope: RetailBusinessScope, options?: { limit?: number }): RetailSaleDto[] | Promise<RetailSaleDto[]>;
  listStockMovements(scope: RetailBusinessScope, options?: { limit?: number }): RetailStockMovementDto[] | Promise<RetailStockMovementDto[]>;
  adjustStock(scope: RetailBusinessScope, actor: RetailActor, input: RetailStockAdjustInput): RetailStockAdjustResultDto | Promise<RetailStockAdjustResultDto>;
  listPromotions(scope: RetailBusinessScope): RetailPromotionDto[] | Promise<RetailPromotionDto[]>;
  togglePromotion(scope: RetailBusinessScope, promotionId: string): { id: string; isActive: boolean } | null | Promise<{ id: string; isActive: boolean } | null>;
};
