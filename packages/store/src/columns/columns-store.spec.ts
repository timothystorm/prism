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
	test.each(["state", "selectedColumns"] as const)(
		"updates %s without changing earlier snapshots, other state, or retaining input references",
		(property) => {
			const { store, actions } = createColumnsStore();
			const initial = store.getState();
			const trackingColumn: Column = { name: "TRACKING_ID" };
			const selectedColumns: Columns = [
				{ name: "STATUS", sortDirection: "desc" },
				trackingColumn,
			];
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			if (property === "state") {
				actions.state = { selectedColumns };
			} else {
				actions.selectedColumns = selectedColumns;
			}

			expect(actions.state).toBe(store.getState().columns);
			expect(actions.selectedColumns).toBe(
				store.getState().columns.selectedColumns,
			);
			expect(actions.selectedColumns).toEqual([
				{ name: "STATUS", sortDirection: "desc" },
				{ name: "TRACKING_ID" },
			]);
			expect(updates).toEqual([
				{
					...initial,
					columns: {
						selectedColumns: [
							{ name: "STATUS", sortDirection: "desc" },
							{ name: "TRACKING_ID" },
						],
					},
				},
			]);
			expect(store.getState().metrics).toBe(initial.metrics);
			expect(initial.columns.selectedColumns).toEqual([
				{ name: "TRACKING_ID" },
				{ name: "STATUS" },
				{ name: "EST_DELIVERY" },
			]);

			selectedColumns.reverse();
			trackingColumn.sortDirection = "asc";
			expect(actions.selectedColumns).toEqual([
				{ name: "STATUS", sortDirection: "desc" },
				{ name: "TRACKING_ID" },
			]);
		},
	);

	test.each(["state", "selectedColumns"] as const)(
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

			for (const selectedColumns of invalidSelections) {
				const { store, actions } = createColumnsStore();
				const initial = store.getState();
				let notifications = 0;
				store.subscribe(() => {
					notifications += 1;
				});
				const value =
					property === "state" ? { selectedColumns } : selectedColumns;

				expect(() => Reflect.set(actions, property, value)).toThrow(ZodError);
				expect(store.getState()).toBe(initial);
				expect(notifications).toBe(0);
			}
		},
	);

	test.each([null, {}, { selectedColumns: "TRACKING_ID" }])(
		"rejects malformed whole-state replacements: %j",
		(state) => {
			const { store, actions } = createColumnsStore();
			const initial = store.getState();

			expect(() => Reflect.set(actions, "state", state)).toThrow(ZodError);
			expect(store.getState()).toBe(initial);
		},
	);
});
