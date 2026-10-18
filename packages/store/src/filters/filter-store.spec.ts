import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "../app-state";
import { FilterStore } from "../index";
import { type Filter, FilterSchema } from "./filters-schema";

function createFilterStore(activeFilters: Filter[] = [], dirty = false) {
	const store = createStore<AppState>(() => ({
		...initialAppState,
		filters: { activeFilters, dirty },
	}));
	const actions = new FilterStore(store.getState, store.setState);
	return { store, actions };
}

describe("FilterStore.getState/setState", () => {
	test("replaces and clears filters without retaining caller-owned criteria or selections", () => {
		const { store, actions } = createFilterStore();
		const initial = store.getState();
		const filter = FilterSchema.parse({
			type: "SHIPMENT:COMMIT_DATE",
			criteria: {
				start: "2026-10-17T00:00:00.000Z",
				end: "2026-10-17T23:59:59.999Z",
			},
		});
		const active = [filter];
		const updates: AppState[] = [];
		store.subscribe((state) => updates.push(state));

		actions.setState({ activeFilters: active, dirty: true });
		active.length = 0;
		if (filter.type === "SHIPMENT:COMMIT_DATE") {
			filter.criteria.start = "2000-10-17T00:00:00.000Z";
			filter.criteria.end = "2000-10-17T23:59:59.999Z";
		}

		expect(actions.getState()).toEqual({
			activeFilters: [
				{
					type: "SHIPMENT:COMMIT_DATE",
					criteria: {
						start: "2026-10-17T00:00:00.000Z",
						end: "2026-10-17T23:59:59.999Z",
					},
				},
			],
			dirty: true,
		});
		expect(initial.filters).toEqual({ activeFilters: [], dirty: false });
		expect(store.getState().columns).toBe(initial.columns);
		expect(store.getState().metrics).toBe(initial.metrics);
		expect(store.getState().statuses).toBe(initial.statuses);
		expect(updates).toHaveLength(1);

		actions.setState({ activeFilters: [], dirty: false });
		expect(actions.getState()).toEqual({ activeFilters: [], dirty: false });
		expect(updates).toHaveLength(2);
	});

	test.each([
		null,
		{},
		{ activeFilters: [], dirty: "true" },
		{
			activeFilters: [
				{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-1"] },
				{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-2"] },
			],
			dirty: false,
		},
	])(
		"rejects invalid slice replacement %j without changing state or notifying",
		(input) => {
			const { store, actions } = createFilterStore([
				{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" },
			]);
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

describe("FilterStore.getActiveFilters/setActiveFilters", () => {
	test.each([false, true])(
		"replaces and clears the list while preserving dirty=%s, order, and earlier snapshots",
		(dirty) => {
			const { store, actions } = createFilterStore(
				[{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-1"] }],
				dirty,
			);
			const initial = store.getState();
			const criteria = {
				start: "2026-10-17T16:05:02.359Z",
				end: "2026-10-17T17:30:45.012Z",
			};
			const input: Filter[] = [
				{ type: "SHIPMENT:COMMIT_DATE", criteria },
				{ type: "SHIPMENT:SIGNATURE_AVAILABLE", criteria: true },
			];
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			actions.setActiveFilters(input);
			criteria.start = "2000-10-17T00:00:00.000Z";
			input.reverse();
			input.push({ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "DELAYED" });

			expect(actions.getActiveFilters()).toBe(
				store.getState().filters.activeFilters,
			);
			expect(actions.getState()).toEqual({
				activeFilters: [
					{
						type: "SHIPMENT:COMMIT_DATE",
						criteria: {
							start: "2026-10-17T16:05:02.359Z",
							end: "2026-10-17T17:30:45.012Z",
						},
					},
					{ type: "SHIPMENT:SIGNATURE_AVAILABLE", criteria: true },
				],
				dirty,
			});
			expect(initial.filters).toEqual({
				activeFilters: [
					{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-1"] },
				],
				dirty,
			});
			expect(store.getState().columns).toBe(initial.columns);
			expect(store.getState().metrics).toBe(initial.metrics);
			expect(store.getState().statuses).toBe(initial.statuses);
			expect(updates).toHaveLength(1);

			actions.setActiveFilters([]);

			expect(actions.getActiveFilters()).toEqual([]);
			expect(actions.getState().dirty).toBe(dirty);
			expect(updates).toHaveLength(2);
		},
	);

	test("notifies for equal filter contents in a replacement list", () => {
		const { store, actions } = createFilterStore([
			{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" },
		]);
		const initial = store.getState();
		const updates: AppState[] = [];
		store.subscribe((state) => updates.push(state));

		actions.setActiveFilters([
			{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" },
		]);

		expect(actions.getActiveFilters()).toEqual(initial.filters.activeFilters);
		expect(actions.getActiveFilters()).not.toBe(initial.filters.activeFilters);
		expect(updates).toHaveLength(1);
	});

	test("stores parsed defaults when criteria are omitted", () => {
		const { actions } = createFilterStore();

		actions.setActiveFilters([{ type: "SHIPMENT:SIGNATURE_AVAILABLE" }]);

		expect(actions.getActiveFilters()).toEqual([
			{ type: "SHIPMENT:SIGNATURE_AVAILABLE", criteria: false },
		]);
	});

	test.each([
		{ filters: null },
		{ filters: {} },
		{
			filters: [
				{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-1"] },
				{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-2"] },
			],
		},
		{
			filters: [
				{ type: "SHIPMENT:SIGNATURE_AVAILABLE", criteria: true },
				{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "UNKNOWN" },
			],
		},
		{
			filters: [
				{
					type: "SHIPMENT:COMMIT_DATE",
					criteria: {
						start: "2026-10-17T00:00:00.000-06:00",
						end: "2026-10-18T23:59:59.999-06:00",
					},
				},
			],
		},
	])(
		"rejects an invalid replacement list $filters without changing state or notifying",
		({ filters }) => {
			const { store, actions } = createFilterStore(
				[{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" }],
				true,
			);
			const initial = store.getState();
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			expect(() =>
				Reflect.apply(actions.setActiveFilters, actions, [filters]),
			).toThrow(ZodError);
			expect(store.getState()).toBe(initial);
			expect(updates).toHaveLength(0);
		},
	);
});
