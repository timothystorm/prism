import { describe, expect, test } from "vitest";
import { ZodError, type z } from "zod";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "../app-state";
import { FilterStore } from "./filter-store";
import { type Filter, FilterSchema } from "./filters-schema";

function createFilterStore(active: Filter[] = [], dirty = false) {
	const store = createStore<AppState>(() => ({
		...initialAppState,
		filters: { active, dirty },
	}));
	const actions = new FilterStore(store.getState, store.setState);
	return { store, actions };
}

describe("FilterStore.state", () => {
	test("replaces and clears filters without retaining caller-owned dates or selections", () => {
		const { store, actions } = createFilterStore();
		const initial = store.getState();
		const filter = FilterSchema.parse({
			type: "SHIPMENT:COMMIT_DATE",
			criteria: {
				start: "2026-10-17",
				end: "2026-10-17",
				timeZone: "UTC",
			},
		});
		const active = [filter];
		const updates: AppState[] = [];
		store.subscribe((state) => updates.push(state));

		actions.state = { active, dirty: true };
		active.length = 0;
		if (filter.type === "SHIPMENT:COMMIT_DATE") {
			filter.criteria.start.setUTCFullYear(2000);
			filter.criteria.end.setUTCFullYear(2000);
		}

		expect(actions.state).toEqual({
			active: [
				{
					type: "SHIPMENT:COMMIT_DATE",
					criteria: {
						start: new Date("2026-10-17T00:00:00.000Z"),
						end: new Date("2026-10-17T23:59:59.999Z"),
					},
				},
			],
			dirty: true,
		});
		expect(initial.filters).toEqual({ active: [], dirty: false });
		expect(store.getState().columns).toBe(initial.columns);
		expect(store.getState().metrics).toBe(initial.metrics);
		expect(store.getState().statuses).toBe(initial.statuses);
		expect(updates).toHaveLength(1);

		actions.state = { active: [], dirty: false };
		expect(actions.state).toEqual({ active: [], dirty: false });
		expect(updates).toHaveLength(2);
	});

	test.each([
		null,
		{},
		{ active: [], dirty: "true" },
		{
			active: [
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

			expect(() => Reflect.set(actions, "state", input)).toThrow(ZodError);
			expect(store.getState()).toBe(initial);
			expect(updates).toHaveLength(0);
		},
	);
});

describe.each([false, true])(
	"FilterStore.removeActiveFilter with dirty=%s",
	(dirty) => {
		test.each([
			{
				filterType: "SHIPMENT:INVOICE_NUMBER",
				remainingTypes: [
					"SHIPMENT:COMMIT_DATE",
					"SHIPMENT:DELIVERY_PREDICTION",
				],
			},
			{
				filterType: "SHIPMENT:COMMIT_DATE",
				remainingTypes: [
					"SHIPMENT:INVOICE_NUMBER",
					"SHIPMENT:DELIVERY_PREDICTION",
				],
			},
			{
				filterType: "SHIPMENT:DELIVERY_PREDICTION",
				remainingTypes: ["SHIPMENT:INVOICE_NUMBER", "SHIPMENT:COMMIT_DATE"],
			},
		])(
			"removes $filterType and notifies once",
			({ filterType, remainingTypes }) => {
				const { store, actions } = createFilterStore(
					[
						{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-1"] },
						{
							type: "SHIPMENT:COMMIT_DATE",
							criteria: {
								start: new Date("2026-10-17T00:00:00.000Z"),
								end: new Date("2026-10-17T23:59:59.999Z"),
							},
						},
						{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" },
					],
					dirty,
				);
				const initial = store.getState();
				const updates: AppState[] = [];
				store.subscribe((state) => updates.push(state));

				const result = actions.removeActiveFilter(filterType);

				expect(result).toBe(actions.state.active);
				expect(result.map((filter) => filter.type)).toEqual(remainingTypes);
				for (const filter of result) {
					expect(initial.filters.active).toContain(filter);
				}
				expect(initial.filters.active.map((filter) => filter.type)).toEqual([
					"SHIPMENT:INVOICE_NUMBER",
					"SHIPMENT:COMMIT_DATE",
					"SHIPMENT:DELIVERY_PREDICTION",
				]);
				expect(actions.state.dirty).toBe(dirty);
				expect(store.getState().columns).toBe(initial.columns);
				expect(store.getState().statuses).toBe(initial.statuses);
				expect(store.getState().metrics).toBe(initial.metrics);
				expect(updates).toHaveLength(1);
				expect(updates[0]).toBe(store.getState());

				const afterRemoval = store.getState();
				expect(actions.removeActiveFilter(filterType)).toBe(result);
				expect(store.getState()).toBe(afterRemoval);
				expect(updates).toHaveLength(1);
			},
		);

		test("removes the only filter and leaves an empty collection", () => {
			const { store, actions } = createFilterStore(
				[{ type: "SHIPMENT:SIGNATURE_AVAILABLE", criteria: false }],
				dirty,
			);
			const initial = store.getState();
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			const result = actions.removeActiveFilter("SHIPMENT:SIGNATURE_AVAILABLE");

			expect(result).toBe(actions.state.active);
			expect(actions.state).toEqual({ active: [], dirty });
			expect(initial.filters.active).toEqual([
				{ type: "SHIPMENT:SIGNATURE_AVAILABLE", criteria: false },
			]);
			expect(updates).toHaveLength(1);
		});

		test.each(["SHIPMENT:SIGNATURE_AVAILABLE", "UNKNOWN", ""])(
			"ignores absent type %j in populated and empty collections",
			(filterType) => {
				const activeCollections: Filter[][] = [
					[],
					[{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" }],
				];
				for (const active of activeCollections) {
					const { store, actions } = createFilterStore(active, dirty);
					const initial = store.getState();
					const updates: AppState[] = [];
					store.subscribe((state) => updates.push(state));

					expect(actions.removeActiveFilter(filterType)).toBe(
						initial.filters.active,
					);
					expect(store.getState()).toBe(initial);
					expect(updates).toHaveLength(0);
				}
			},
		);
	},
);

describe("FilterStore.addActiveFilter", () => {
	test.each([false, true])(
		"adds a validated filter without changing dirty=%s or retaining caller input",
		(dirty) => {
			const { store, actions } = createFilterStore([], dirty);
			const initial = store.getState();
			const filter: Filter = {
				type: "SHIPMENT:DESTINATION",
				criteria: [{ type: "CITY", value: "Chicago" }],
			};
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			const result = actions.addActiveFilter(filter);
			filter.criteria[0] = { type: "CITY", value: "Atlanta" };
			filter.criteria.push({ type: "CITY", value: "Boston" });

			expect(result).toBe(actions.state.active);
			expect(actions.state).toEqual({
				active: [
					{
						type: "SHIPMENT:DESTINATION",
						criteria: [{ type: "CITY", value: "Chicago" }],
					},
				],
				dirty,
			});
			expect(initial.filters).toEqual({ active: [], dirty });
			expect(store.getState().columns).toBe(initial.columns);
			expect(store.getState().statuses).toBe(initial.statuses);
			expect(store.getState().metrics).toBe(initial.metrics);
			expect(updates).toHaveLength(1);
		},
	);

	test.each([false, true])(
		"ignores the same object without changing dirty=%s or notifying subscribers",
		(dirty) => {
			const filter: Filter = {
				type: "SHIPMENT:DELIVERY_PREDICTION",
				criteria: "ON_TIME",
			};
			const { store, actions } = createFilterStore([filter], dirty);
			const initial = store.getState();
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			expect(actions.addActiveFilter(filter)).toBe(initial.filters.active);
			expect(store.getState()).toBe(initial);
			expect(updates).toHaveLength(0);
		},
	);

	const identicalFilters: z.input<typeof FilterSchema>[] = [
		{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-1", "INV-2"] },
		{
			type: "SHIPMENT:DESTINATION",
			criteria: [{ value: "Chicago", type: "CITY" }],
		},
		{
			type: "SHIPMENT:TIME_IN_NETWORK",
			criteria: { end: "17:00", start: "08:00" },
		},
		{
			type: "SHIPMENT:COMMIT_DATE",
			criteria: {
				start: "2026-10-17",
				end: "2026-10-18",
				timeZone: "UTC",
			},
		},
		{ type: "SHIPMENT:SIGNATURE_AVAILABLE" },
	];

	test.each(identicalFilters)(
		"ignores equivalent parsed criteria for $type",
		(filter) => {
			const { store, actions } = createFilterStore([
				FilterSchema.parse(filter),
			]);
			const initial = store.getState();
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			expect(actions.addActiveFilter(filter)).toBe(initial.filters.active);
			expect(store.getState()).toBe(initial);
			expect(updates).toHaveLength(0);
		},
	);

	test.each([false, true])(
		"replaces changed criteria in place without changing dirty=%s and notifies once",
		(dirty) => {
			const { store, actions } = createFilterStore(
				[
					{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-1"] },
					{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" },
					{ type: "SHIPMENT:SIGNATURE_AVAILABLE", criteria: true },
				],
				dirty,
			);
			const initial = store.getState();
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			const result = actions.addActiveFilter({
				type: "SHIPMENT:DELIVERY_PREDICTION",
				criteria: "DELAYED",
			});

			expect(result).toBe(actions.state.active);
			expect(actions.state).toEqual({
				active: [
					{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-1"] },
					{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "DELAYED" },
					{ type: "SHIPMENT:SIGNATURE_AVAILABLE", criteria: true },
				],
				dirty,
			});
			expect(result[0]).toBe(initial.filters.active[0]);
			expect(result[2]).toBe(initial.filters.active[2]);
			expect(initial.filters.active[1]?.criteria).toBe("ON_TIME");
			expect(initial.filters.dirty).toBe(dirty);
			expect(updates).toHaveLength(1);
		},
	);

	test("compares date values and preserves stored dates when adding another filter", () => {
		const { store, actions } = createFilterStore();
		actions.addActiveFilter({
			type: "SHIPMENT:COMMIT_DATE",
			criteria: {
				start: "2026-10-17",
				end: "2026-10-17",
				timeZone: "UTC",
			},
		});
		const initial = store.getState();

		actions.addActiveFilter({
			type: "SHIPMENT:INVOICE_NUMBER",
			criteria: ["INV-1"],
		});
		expect(actions.state.active[0]).toBe(initial.filters.active[0]);

		actions.addActiveFilter({
			type: "SHIPMENT:COMMIT_DATE",
			criteria: {
				start: "2026-10-18",
				end: "2026-10-18",
				timeZone: "UTC",
			},
		});
		expect(actions.state.active).toEqual([
			{
				type: "SHIPMENT:COMMIT_DATE",
				criteria: {
					start: new Date("2026-10-18T00:00:00.000Z"),
					end: new Date("2026-10-18T23:59:59.999Z"),
				},
			},
			{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-1"] },
		]);
	});

	test.each([
		null,
		{ type: "UNKNOWN", criteria: true },
		{ type: "SHIPMENT:INVOICE_NUMBER", criteria: [] },
		{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "UNKNOWN" },
	])(
		"rejects invalid input %j without changing state or notifying",
		(filter) => {
			const { store, actions } = createFilterStore([
				{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" },
			]);
			const initial = store.getState();
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			expect(() =>
				Reflect.apply(actions.addActiveFilter, actions, [filter]),
			).toThrow(ZodError);
			expect(store.getState()).toBe(initial);
			expect(updates).toHaveLength(0);
		},
	);
});
