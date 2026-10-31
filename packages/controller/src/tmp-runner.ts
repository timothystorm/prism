// biome-ignore-all lint: Temporary test script.

import { AppStore } from "@fedex/prism-store";
import { GraphqlUserService, UserProvider } from "@fedex/prism-user";
import { AppController } from "./app-controller";
import { createDefaultCommandHandlers } from "./default-command-handlers";

// 1. Build the store and Controller
const store = new AppStore();
const userService = new GraphqlUserService();
const userProvider = new UserProvider(userService);
const defaultHandlers = createDefaultCommandHandlers({
  store,
  userProvider,
});
const controller = new AppController(defaultHandlers);

// 2.1. Subscribe to the store to listen for changes in active filters
store.subscribe(
  (state) => state.filters.activeFilters,
  (newValue, previousValue) => {
    console.log("🪣 Active filters changed from", previousValue, "to", newValue);
  },
);

// 2.2 Subscribe to the store to listen for changes in active metric
store.subscribe(
  (state) => state.metrics.activeMetric,
  (newValue, previousValue) => {
    console.log("📊 Active metric changed from", previousValue, "to", newValue);
  },
);

// 3. Dispatch a command to set active filters
await controller.dispatch({
  type: "FILTERS:SET_ACTIVE",
  filters: [
    // allowed filters
    { type: "SHIPMENT:SHIP_DATE", criteria: { start: "2023-01-01", end: "2023-12-31" } },
    { type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-12345", "INV-67890"] },
  ],
});

// 4. Dispatch a command to set active filters with some disallowed filters
await controller.dispatch({
  type: "FILTERS:SET_ACTIVE",
  filters: [
    // allowed + disallowed filters
    { type: "SHIPMENT:COMMIT_DATE", criteria: { start: "2023-01-01", end: "2023-12-31" } },
    {
      type: "SHIPMENT:EST_DELIVERY_DATE_TIME",
      criteria: { start: "2023-01-01T00:00:00Z", end: "2023-12-31T12:00:00Z" },
    },
    { type: "SHIPMENT:GPS_DELIVERY_LOCATION", criteria: true },
  ],
});

// 5. Dispatch a command to set active metric
await controller.dispatch({
  type: "METRICS:SET_ACTIVE",
  metric: "ARRIVING_EARLY",
});
