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

test.each([
  { tier: "BASIC", allowed: false },
  { tier: "PREMIUM", allowed: true },
] as const)(
  "retains premium gating for combined estimated delivery with tier $tier",
  async ({ tier, allowed }) => {
    const store = new AppStore();
    store.filters.setState({ activeFilters: [], dirty: true });
    const userProvider = new UserProvider({
      fetchAccounts: async () => [{ id: "account-1", accountTier: tier }],
    });
    const controller = new AppController(createDefaultCommandHandlers({ store, userProvider }));
    const filter = {
      type: "SHIPMENT:EST_DELIVERY_DATE_TIME" as const,
      criteria: { start: "2026-10-31T00:00:00Z", end: "2026-10-31T12:00:00.000Z" },
    };

    await controller.dispatch({ type: "FILTERS:SET_ACTIVE", filters: [filter] });

    expect(store.filters.getActiveFilters()).toEqual(allowed ? [filter] : []);
    expect(store.filters.getState().dirty).toBe(true);
  },
);
