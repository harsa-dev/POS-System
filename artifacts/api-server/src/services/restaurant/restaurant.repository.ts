import type {
  RestaurantBusinessScope,
  RestaurantDashboardSummaryDto,
  RestaurantMenuItemDto,
  RestaurantOrderDto,
  RestaurantTableDto,
  RestaurantWorkflowSummaryDto,
} from "./restaurant.types.js";

export type RestaurantRepository = {
  getDashboardSummary(scope: RestaurantBusinessScope): Promise<RestaurantDashboardSummaryDto> | RestaurantDashboardSummaryDto;
  getWorkflowSummary(scope: RestaurantBusinessScope): Promise<RestaurantWorkflowSummaryDto> | RestaurantWorkflowSummaryDto;
  listMenuItems(scope: RestaurantBusinessScope): Promise<RestaurantMenuItemDto[]> | RestaurantMenuItemDto[];
  listTables(scope: RestaurantBusinessScope): Promise<RestaurantTableDto[]> | RestaurantTableDto[];
  listActiveOrders(scope: RestaurantBusinessScope): Promise<RestaurantOrderDto[]> | RestaurantOrderDto[];
  listKitchenQueue(scope: RestaurantBusinessScope): Promise<RestaurantOrderDto[]> | RestaurantOrderDto[];
  listServingQueue(scope: RestaurantBusinessScope): Promise<RestaurantOrderDto[]> | RestaurantOrderDto[];
};
