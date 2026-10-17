import { describe, expect, test } from "vitest";
import { AccountsStateSchema, initialAccountsState } from "./accounts-state";

describe("AccountsStateSchema", () => {
	test.each([
		{ active: [] },
		{ active: ["account-1"] },
		{ active: ["account-2", "account-1"] },
	])(
		"preserves active selections and defaults dirty to false: %j",
		({ active }) => {
			expect(AccountsStateSchema.parse({ active })).toEqual({
				active,
				dirty: false,
			});
		},
	);

	test.each([true, false])(
		"preserves explicitly supplied dirty=%s",
		(dirty) => {
			const state = { active: ["account-1"], dirty };

			expect(AccountsStateSchema.parse(state)).toEqual(state);
		},
	);

	test("defaults undefined dirty to false without modifying input", () => {
		const state = { active: ["account-1"], dirty: undefined };

		expect(AccountsStateSchema.parse(state)).toEqual({
			active: ["account-1"],
			dirty: false,
		});
		expect(state.dirty).toBeUndefined();
	});

	test.each([
		{},
		{ active: null },
		{ active: "account-1" },
		{ active: [1] },
		{ active: [null] },
		{ active: [""] },
		{ active: ["account-1", ""] },
		{ active: ["account-1", "account-1"] },
		{ active: ["account-1", "account-2", "account-1"] },
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
		expect(AccountsStateSchema.safeParse({ active: [], dirty }).success).toBe(
			false,
		);
	});

	test("accepts the initial state with no active accounts and a clean flag", () => {
		expect(AccountsStateSchema.parse(initialAccountsState)).toEqual({
			active: [],
			dirty: false,
		});
	});
});
