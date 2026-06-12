export {
  checkOrderStatusTransition,
  legacyOrderStatusPermissions,
  legacyOrderStatusTransitions,
  type OrderStatusDecision,
} from "./order-status-rules.js";

export {
  assertCanMoveOrderStatus,
  canMoveOrderStatus,
  legacyRestaurantOrderTransitions,
} from "./order-status-workflow.js";

export {
  transitionOrderStatus,
  type TransitionOrderStatusInput,
  type TransitionOrderStatusResult,
} from "./transition-order-status.service.js";
