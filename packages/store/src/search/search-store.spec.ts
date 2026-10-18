import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "../app-state";
import { type Search, type SearchState, SearchStore } from "../index";
import { initialSearchState } from "./search-state";

function createSearchStore(dirty = false) {
	const store = createStore<AppState>(() => ({
		...initialAppState,
		search: { ...initialSearchState, dirty },
	}));
	const actions = new SearchStore(store.getState, store.setState);
	return { store, actions };
}

describe("SearchStore", () => {
	test.each([false, true])(
		"replaces and clears a search immutably while preserving dirty=%s",
		(dirty) => {
			const { store, actions } = createSearchStore(dirty);
			const initial = store.getState();
			const input: Search = {
				query: "  Chicago  ",
				category: "DESTINATION_CITY",
			};
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			actions.setSearchTerm(input);
			input.query = "Caller mutation";
			input.category = "SHIPPER_REFERENCE";

			expect(actions.getSearchTerm()).toMatchObject({
				query: "  Chicago  ",
				category: "DESTINATION_CITY",
			});
			expect(actions.getState()).toEqual({
				query: "  Chicago  ",
				category: "DESTINATION_CITY",
				dirty,
			});
			expect(initial.search).toEqual({
				query: "",
				category: "TRACKING_NUMBER",
				dirty,
			});
			for (const key of [
				"account",
				"columns",
				"filters",
				"metrics",
				"statuses",
				"views",
			] as const) {
				expect(store.getState()[key]).toBe(initial[key]);
			}
			expect(updates).toHaveLength(1);

			actions.setSearchTerm({ query: "", category: "DESTINATION_CITY" });

			expect(actions.getState()).toEqual({
				query: "",
				category: "DESTINATION_CITY",
				dirty,
			});
			expect(updates).toHaveLength(2);
		},
	);

	test.each([false, true])(
		"ignores dirty in a domain search input while preserving dirty=%s",
		(dirty) => {
			const { actions } = createSearchStore(dirty);
			const input: SearchState = {
				query: "123",
				category: "TRACKING_NUMBER",
				dirty: !dirty,
			};

			actions.setSearchTerm(input);

			expect(actions.getState()).toEqual({
				query: "123",
				category: "TRACKING_NUMBER",
				dirty,
			});
		},
	);

	test.each([
		null,
		{},
		{ query: "123" },
		{ category: "TRACKING_NUMBER" },
		{ query: 123, category: "TRACKING_NUMBER" },
		{ query: "123", category: "UNKNOWN" },
	])(
		"rejects an invalid search without changes or notifications: %j",
		(input) => {
			const { store, actions } = createSearchStore(true);
			const initial = store.getState();
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			expect(() =>
				Reflect.apply(actions.setSearchTerm, actions, [input]),
			).toThrow(ZodError);
			expect(store.getState()).toBe(initial);
			expect(updates).toHaveLength(0);
		},
	);

	test("lets controllers replace search and dirty together without retaining input references", () => {
		const { store, actions } = createSearchStore();
		const initial = store.getState();
		const input: SearchState = {
			query: "REF-123",
			category: "SHIPPER_REFERENCE",
			dirty: true,
		};
		const updates: AppState[] = [];
		store.subscribe((state) => updates.push(state));

		actions.setState(input);
		input.query = "Caller mutation";
		input.dirty = false;

		expect(actions.getState()).toEqual({
			query: "REF-123",
			category: "SHIPPER_REFERENCE",
			dirty: true,
		});
		expect(initial.search).toEqual({
			query: "",
			category: "TRACKING_NUMBER",
			dirty: false,
		});
		expect(store.getState().filters).toBe(initial.filters);
		expect(updates).toHaveLength(1);

		actions.setState(initialSearchState);

		expect(actions.getState()).toEqual({
			query: "",
			category: "TRACKING_NUMBER",
			dirty: false,
		});
		expect(updates).toHaveLength(2);
	});

	test.each([{ query: null }, { category: "UNKNOWN" }, { dirty: "true" }])(
		"rejects an invalid full search slice without notifying: %j",
		(input) => {
			const { store, actions } = createSearchStore(true);
			const initial = store.getState();
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			expect(() => Reflect.apply(actions.setState, actions, [input])).toThrow(
				ZodError,
			);
			expect(store.getState()).toBe(initial);
			expect(updates).toHaveLength(0);
		},
	);
});
