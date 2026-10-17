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

		expect(actions.state).toEqual({ active: [], dirty: false });
		expect(AccountsStateSchema.parse(initialAccountsState)).toEqual(
			initialAccountsState,
		);
		expect(AccountsStateSchema.parse({ active: ["accounts-1"] })).toEqual({
			active: ["accounts-1"],
			dirty: false,
		});
	});

	test.each(["state", "activeAccounts"] as const)(
		"updates %s immutably without retaining input references or changing other slices",
		(property) => {
			const { store, actions } = createAccountStore();
			const initial = store.getState();
			const activeAccounts = ["accounts-1", "accounts-2"];
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			if (property === "state") {
				actions.state = { active: activeAccounts, dirty: true };
			} else {
				actions.activeAccounts = activeAccounts;
			}

			expect(actions.state).toBe(store.getState().account);
			expect(store.getState().account.active).toEqual([
				"accounts-1",
				"accounts-2",
			]);
			expect(actions.activeAccounts).toEqual(["accounts-1", "accounts-2"]);
			expect(initial.account).toEqual(initialAccountsState);
			for (const key of [
				"metrics",
				"columns",
				"statuses",
				"filters",
			] as const) {
				expect(store.getState()[key]).toBe(initial[key]);
			}
			expect(updates).toHaveLength(1);
			activeAccounts.push("accounts-3");
			expect(actions.activeAccounts).toEqual(["accounts-1", "accounts-2"]);
		},
	);

	test.each([false, true])(
		"selects one or multiple accounts and clears selections while preserving dirty=%s",
		(dirty) => {
			const { actions } = createAccountStore();
			actions.state = { active: [], dirty };

			for (const activeAccounts of [
				["accounts-1"],
				["accounts-1", "accounts-2"],
				[],
			]) {
				actions.activeAccounts = activeAccounts;
				expect(actions.state).toEqual({ active: activeAccounts, dirty });
			}
		},
	);

	describe.each(["state", "activeAccounts"] as const)(
		"%s validation",
		(property) => {
			test.each([
				{ active: null },
				{ active: "accounts-1" },
				{ active: [1] },
				{ active: [""] },
				{ active: ["accounts-1", "accounts-1"] },
			])(
				"rejects invalid selections $active without updating or notifying",
				({ active }) => {
					const { store, actions } = createAccountStore();
					const initial = store.getState();
					const updates: AppState[] = [];
					store.subscribe((state) => updates.push(state));

					expect(() =>
						Reflect.set(
							actions,
							property,
							property === "state" ? { active, dirty: false } : active,
						),
					).toThrow(ZodError);
					expect(store.getState()).toBe(initial);
					expect(updates).toHaveLength(0);
				},
			);
		},
	);
});
