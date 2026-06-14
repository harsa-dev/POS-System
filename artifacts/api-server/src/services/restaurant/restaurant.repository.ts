import type {
  RestaurantBusinessScope,
  RestaurantDashboardSummaryDto,
  RestaurantMenuItemDto,
  RestaurantOrderDto,
  RestaurantTableDto,
} from "./restaurant.types.js";

export type RestaurantRepository = {
  getDashboardSummary(scope: RestaurantBusinessScope): Promise<RestaurantDashboardSummaryDto> | RestaurantDashboardSummaryDto;
  listMenuItems(scope: RestaurantBusinessScope): Promise<RestaurantMenuItemDto[]> | RestaurantMenuItemDto[];
  listTables(scope: RestaurantBusinessScope): Promise<RestaurantTableDto[]> | RestaurantTableDto[];
  listActiveOrders(scope: RestaurantBusinessScope): Promise<RestaurantOrderDto[]> | RestaurantOrderDto[];
  listKitchenQueue(scope: RestaurantBusinessScope): Promise<RestaurantOrderDto[]> | RestaurantOrderDto[];
  listServingQueue(scope: RestaurantBusinessScope): Promise<RestaurantOrderDto[]> | RestaurantOrderDto[];
};
