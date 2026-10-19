import { AppStore } from "@fedex/prism-store";
import { UserProvider } from "@fedex/prism-user";
import { expect, test } from "vitest";
import { AppController } from "./app-controller";
import { createDefaultCommandHandlers } from "./default-command-handlers";

test("default handlers dispatch metric commands to the shared store", async () => {
  const store = new AppStore();
  const userProvider = new UserProvider({ fetchAccounts: async () => [] });
  const controller = new AppController(createDefaultCommandHandlers({ store, userProvider }));

  await controller.dispatch({ type: "METRICS:SET_ACTIVE", metric: "EXCEPTION" });

  expect(store.metrics.getActiveMetric()).toBe("EXCEPTION");
});

test("dispatches date-only filter criteria without adding a time or timezone", async () => {
  const store = new AppStore();
  const userProvider = new UserProvider({
    fetchAccounts: async () => [{ id: "account-1", accountTier: "BASIC" }],
  });
  const controller = new AppController(createDefaultCommandHandlers({ store, userProvider }));

  await controller.dispatch({
    type: "FILTERS:SET_ACTIVE",
    filters: [
      {
        type: "SHIPMENT:SHIP_DATE",
        criteria: { start: "2023-01-01", end: "2023-12-31" },
      },
    ],
  });

  expect(store.filters.getActiveFilters()).toEqual([
    {
      type: "SHIPMENT:SHIP_DATE",
      criteria: { start: "2023-01-01", end: "2023-12-31" },
    },
  ]);
});
