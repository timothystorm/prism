import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "../app-state";
import type { Column, Columns } from "./columns-schema";
import { ColumnsStore } from "./columns-store";

function createColumnsStore() {
	const store = createStore<AppState>(() => ({ ...initialAppState }));
	const actions = new ColumnsStore(store.getState, store.setState);
	return { store, actions };
}

describe("ColumnsStore", () => {
	test.each(["setState", "setActiveColumns"] as const)(
		"updates %s without changing earlier snapshots, other state, or retaining input references",
		(property) => {
			const { store, actions } = createColumnsStore();
			const initial = store.getState();
			const trackingColumn: Column = { name: "TRACKING_ID" };
			const activeColumns: Columns = [
				{ name: "STATUS", sortDirection: "desc" },
				trackingColumn,
			];
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			if (property === "setState") {
				actions.setState({ activeColumns, dirty: false });
			} else {
				actions.setActiveColumns(activeColumns);
			}

			expect(actions.getState()).toBe(store.getState().columns);
			expect(actions.getActiveColumns()).toBe(
				store.getState().columns.activeColumns,
			);
			expect(actions.getActiveColumns()).toEqual([
				{ name: "STATUS", sortDirection: "desc" },
				{ name: "TRACKING_ID" },
			]);
			expect(updates).toEqual([
				{
					...initial,
					columns: {
						activeColumns: [
							{ name: "STATUS", sortDirection: "desc" },
							{ name: "TRACKING_ID" },
						],
						dirty: false,
					},
				},
			]);
			expect(store.getState().metrics).toBe(initial.metrics);
			expect(initial.columns.activeColumns).toEqual([
				{ name: "TRACKING_ID" },
				{ name: "STATUS" },
				{ name: "EST_DELIVERY" },
			]);

			activeColumns.reverse();
			trackingColumn.sortDirection = "asc";
			expect(actions.getActiveColumns()).toEqual([
				{ name: "STATUS", sortDirection: "desc" },
				{ name: "TRACKING_ID" },
			]);
		},
	);

	test.each([false, true])(
		"preserves controller-managed dirty=%s when updating active columns",
		(dirty) => {
			const { actions } = createColumnsStore();
			actions.setState({ ...actions.getState(), dirty });

			actions.setActiveColumns([{ name: "TRACKING_ID" }]);

			expect(actions.getState()).toEqual({
				activeColumns: [{ name: "TRACKING_ID" }],
				dirty,
			});
		},
	);

	test("allows the controller to toggle dirty through state replacement without changing selections", () => {
		const { store, actions } = createColumnsStore();
		const initial = store.getState();
		const updates: AppState[] = [];
		store.subscribe((state) => updates.push(state));

		actions.setState({ ...actions.getState(), dirty: true });
		actions.setState({ ...actions.getState(), dirty: false });

		expect(updates.map((state) => state.columns)).toEqual([
			{ activeColumns: initial.columns.activeColumns, dirty: true },
			{ activeColumns: initial.columns.activeColumns, dirty: false },
		]);
		expect(initial.columns.dirty).toBe(false);
	});

	test.each([null, "true", 1])(
		"rejects invalid dirty=%j without updating or notifying",
		(dirty) => {
			const { store, actions } = createColumnsStore();
			const initial = store.getState();
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			expect(() =>
				Reflect.apply(actions.setState, actions, [
					{ ...actions.getState(), dirty },
				]),
			).toThrow(ZodError);
			expect(store.getState()).toBe(initial);
			expect(updates).toHaveLength(0);
		},
	);

	test.each(["setState", "setActiveColumns"] as const)(
		"rejects invalid %s writes without changes or subscriber notifications",
		(property) => {
			const invalidSelections = [
				null,
				[],
				[{ name: "STATUS" }],
				[{ name: "TRACKING_ID" }, { name: "TRACKING_ID" }],
				[{ name: "TRACKING_ID" }, { name: "UNKNOWN" }],
				[{ name: "TRACKING_ID", sortDirection: "ascending" }],
			];

			for (const activeColumns of invalidSelections) {
				const { store, actions } = createColumnsStore();
				const initial = store.getState();
				let notifications = 0;
				store.subscribe(() => {
					notifications += 1;
				});
				const value =
					property === "setState"
						? { activeColumns, dirty: false }
						: activeColumns;

				expect(() =>
					Reflect.apply(actions[property], actions, [value]),
				).toThrow(ZodError);
				expect(store.getState()).toBe(initial);
				expect(notifications).toBe(0);
			}
		},
	);

	test.each([null, {}, { activeColumns: "TRACKING_ID" }])(
		"rejects malformed whole-state replacements: %j",
		(state) => {
			const { store, actions } = createColumnsStore();
			const initial = store.getState();

			expect(() => Reflect.apply(actions.setState, actions, [state])).toThrow(
				ZodError,
			);
			expect(store.getState()).toBe(initial);
		},
	);
});
