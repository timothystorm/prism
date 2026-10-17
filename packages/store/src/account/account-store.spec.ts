import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "../app-state";
import { AccountStateSchema, initialAccountState } from "./account-state";
import { AccountStore } from "./account-store";

function createAccountStore() {
	const store = createStore<AppState>(() => ({ ...initialAppState }));
	const actions = new AccountStore(store.getState, store.setState);
	return { store, actions };
}

describe("AccountStore", () => {
	test("starts with no active accounts and a clean state", () => {
		const { actions } = createAccountStore();

		expect(actions.state).toEqual({ activeAccounts: [], dirty: false });
		expect(AccountStateSchema.parse(initialAccountState)).toEqual(
			initialAccountState,
		);
		expect(AccountStateSchema.parse({ activeAccounts: ["account-1"] })).toEqual(
			{
				activeAccounts: ["account-1"],
				dirty: false,
			},
		);
	});

	test.each(["state", "activeAccounts"] as const)(
		"updates %s immutably without retaining input references or changing other slices",
		(property) => {
			const { store, actions } = createAccountStore();
			const initial = store.getState();
			const activeAccounts = ["account-1", "account-2"];
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			if (property === "state") {
				actions.state = { activeAccounts, dirty: true };
			} else {
				actions.activeAccounts = activeAccounts;
			}

			expect(actions.state).toBe(store.getState().account);
			expect(actions.activeAccounts).toEqual(["account-1", "account-2"]);
			expect(initial.account).toEqual(initialAccountState);
			for (const key of [
				"metrics",
				"columns",
				"statuses",
				"filters",
			] as const) {
				expect(store.getState()[key]).toBe(initial[key]);
			}
			expect(updates).toHaveLength(1);
			activeAccounts.push("account-3");
			expect(actions.activeAccounts).toEqual(["account-1", "account-2"]);
		},
	);

	test.each([false, true])(
		"selects one or multiple accounts and clears selections while preserving dirty=%s",
		(dirty) => {
			const { actions } = createAccountStore();
			actions.state = { activeAccounts: [], dirty };

			for (const activeAccounts of [
				["account-1"],
				["account-1", "account-2"],
				[],
			]) {
				actions.activeAccounts = activeAccounts;
				expect(actions.state).toEqual({ activeAccounts, dirty });
			}
		},
	);

	describe.each(["state", "activeAccounts"] as const)(
		"%s validation",
		(property) => {
			test.each([null, "account-1", [1], [""], ["account-1", "account-1"]])(
				"rejects invalid selections %j without updating or notifying",
				(activeAccounts) => {
					const { store, actions } = createAccountStore();
					const initial = store.getState();
					const updates: AppState[] = [];
					store.subscribe((state) => updates.push(state));

					expect(() =>
						Reflect.set(
							actions,
							property,
							property === "state"
								? { activeAccounts, dirty: false }
								: activeAccounts,
						),
					).toThrow(ZodError);
					expect(store.getState()).toBe(initial);
					expect(updates).toHaveLength(0);
				},
			);
		},
	);
});
