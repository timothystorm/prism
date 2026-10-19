import { describe, expect, test } from "vitest";
import { AccountsStateSchema, initialAccountsState } from "./accounts-state";

describe("AccountsStateSchema", () => {
  test.each([
    { activeAccounts: [] },
    { activeAccounts: ["account-1"] },
    { activeAccounts: ["account-2", "account-1"] },
  ])("preserves active selections and defaults dirty to false: %j", ({ activeAccounts }) => {
    expect(AccountsStateSchema.parse({ activeAccounts })).toEqual({
      activeAccounts,
      dirty: false,
    });
  });

  test.each([true, false])("preserves explicitly supplied dirty=%s", (dirty) => {
    const state = { activeAccounts: ["account-1"], dirty };

    expect(AccountsStateSchema.parse(state)).toEqual(state);
  });

  test("defaults undefined dirty to false without modifying input", () => {
    const state = { activeAccounts: ["account-1"], dirty: undefined };

    expect(AccountsStateSchema.parse(state)).toEqual({
      activeAccounts: ["account-1"],
      dirty: false,
    });
    expect(state.dirty).toBeUndefined();
  });

  test.each([
    {},
    { activeAccounts: null },
    { activeAccounts: "account-1" },
    { activeAccounts: [1] },
    { activeAccounts: [null] },
    { activeAccounts: [""] },
    { activeAccounts: ["account-1", ""] },
    { activeAccounts: ["account-1", "account-1"] },
    { activeAccounts: ["account-1", "account-2", "account-1"] },
  ])("rejects missing or invalid active selections: %j", (state) => {
    expect(AccountsStateSchema.safeParse(state).success).toBe(false);
  });

  test.each([
    { dirty: null },
    { dirty: "true" },
    { dirty: "false" },
    { dirty: 0 },
    { dirty: 1 },
    { dirty: {} },
    { dirty: [] },
  ])("rejects non-boolean dirty values: %j", ({ dirty }) => {
    expect(AccountsStateSchema.safeParse({ activeAccounts: [], dirty }).success).toBe(false);
  });

  test("accepts the initial state with no active accounts and a clean flag", () => {
    expect(AccountsStateSchema.parse(initialAccountsState)).toEqual({
      activeAccounts: [],
      dirty: false,
    });
  });
});
