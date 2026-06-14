import type {
  RestaurantBusinessScope,
  RestaurantDashboardSummaryDto,
  RestaurantMenuItemDto,
  RestaurantOrderDto,
  RestaurantPreviewSettingsDto,
  RestaurantTableDto,
  RestaurantWorkflowSummaryDto,
} from "./restaurant.types.js";

export type RestaurantRepository = {
  getPreviewSettings(scope: RestaurantBusinessScope): Promise<RestaurantPreviewSettingsDto> | RestaurantPreviewSettingsDto;
  getDashboardSummary(scope: RestaurantBusinessScope): Promise<RestaurantDashboardSummaryDto> | RestaurantDashboardSummaryDto;
  getWorkflowSummary(scope: RestaurantBusinessScope): Promise<RestaurantWorkflowSummaryDto> | RestaurantWorkflowSummaryDto;
  listMenuItems(scope: RestaurantBusinessScope): Promise<RestaurantMenuItemDto[]> | RestaurantMenuItemDto[];
  listTables(scope: RestaurantBusinessScope): Promise<RestaurantTableDto[]> | RestaurantTableDto[];
  listActiveOrders(scope: RestaurantBusinessScope): Promise<RestaurantOrderDto[]> | RestaurantOrderDto[];
  listKitchenQueue(scope: RestaurantBusinessScope): Promise<RestaurantOrderDto[]> | RestaurantOrderDto[];
  listServingQueue(scope: RestaurantBusinessScope): Promise<RestaurantOrderDto[]> | RestaurantOrderDto[];
};
