import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "../app-state";
import { AccountsStateSchema, initialAccountsState } from "./accounts-state";
import { AccountsStore } from "./accounts-store";

function createAccountStore() {
  const store = createStore<AppState>(() => ({ ...initialAppState }));
  const actions = new AccountsStore(store.getState, store.setState);
  return { store, actions };
}

describe("AccountsStore", () => {
  test("starts with no active accounts and a clean state", () => {
    const { actions } = createAccountStore();

    expect(actions.getState()).toEqual({ activeAccounts: [], dirty: false });
    expect(AccountsStateSchema.parse(initialAccountsState)).toEqual(initialAccountsState);
    expect(AccountsStateSchema.parse({ activeAccounts: ["accounts-1"] })).toEqual({
      activeAccounts: ["accounts-1"],
      dirty: false,
    });
  });

  test.each(["setState", "setActiveAccounts"] as const)(
    "updates %s immutably without retaining input references or changing other slices",
    (property) => {
      const { store, actions } = createAccountStore();
      const initial = store.getState();
      const activeAccounts = ["accounts-1", "accounts-2"];
      const updates: AppState[] = [];
      store.subscribe((state) => updates.push(state));

      if (property === "setState") {
        actions.setState({ activeAccounts: activeAccounts, dirty: true });
      } else {
        actions.setActiveAccounts(activeAccounts);
      }

      expect(actions.getState()).toBe(store.getState().account);
      expect(store.getState().account.activeAccounts).toEqual(["accounts-1", "accounts-2"]);
      expect(actions.getActiveAccounts()).toEqual(["accounts-1", "accounts-2"]);
      expect(initial.account).toEqual(initialAccountsState);
      for (const key of ["metrics", "columns", "statuses", "filters"] as const) {
        expect(store.getState()[key]).toBe(initial[key]);
      }
      expect(updates).toHaveLength(1);
      activeAccounts.push("accounts-3");
      expect(actions.getActiveAccounts()).toEqual(["accounts-1", "accounts-2"]);
    },
  );

  test.each([false, true])(
    "selects one or multiple accounts and clears selections while preserving dirty=%s",
    (dirty) => {
      const { actions } = createAccountStore();
      actions.setState({ activeAccounts: [], dirty });

      for (const activeAccounts of [["accounts-1"], ["accounts-1", "accounts-2"], []]) {
        actions.setActiveAccounts(activeAccounts);
        expect(actions.getState()).toEqual({
          activeAccounts: activeAccounts,
          dirty,
        });
      }
    },
  );

  describe.each(["setState", "setActiveAccounts"] as const)("%s validation", (property) => {
    test.each([
      { active: null },
      { active: "accounts-1" },
      { active: [1] },
      { active: [""] },
      { active: ["accounts-1", "accounts-1"] },
    ])("rejects invalid selections $active without updating or notifying", ({ active }) => {
      const { store, actions } = createAccountStore();
      const initial = store.getState();
      const updates: AppState[] = [];
      store.subscribe((state) => updates.push(state));

      expect(() =>
        Reflect.apply(actions[property], actions, [
          property === "setState" ? { active, dirty: false } : active,
        ]),
      ).toThrow(ZodError);
      expect(store.getState()).toBe(initial);
      expect(updates).toHaveLength(0);
    });
  });
});
