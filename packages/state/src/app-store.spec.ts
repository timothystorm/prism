import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { type AppState, initialAppState } from "./app-state";
import { AppStore } from "./app-store";

describe("AppStore", () => {
	describe("internal state replacement", () => {
		test("replaces the full state atomically without changing earlier snapshots or retaining input references", () => {
			const appStore = new AppStore();
			const initial = appStore._state;
			const nextState: AppState = {
				metrics: {
					focusedMetric: "EXCEPTION",
					trackedMetrics: ["EXCEPTION"],
				},
				columns: {
					selectedColumns: [
						{ name: "STATUS", sortDirection: "desc" },
						{ name: "TRACKING_ID" },
					],
				},
			};
			const updates: Array<{ value: AppState; previousValue: AppState }> = [];
			appStore.subscribe(
				(state) => state,
				(value, previousValue) => updates.push({ value, previousValue }),
			);

			appStore._state = nextState;

			expect(appStore._state).toEqual(nextState);
			expect(updates).toHaveLength(1);
			expect(updates[0]?.value).toBe(appStore._state);
			expect(updates[0]?.previousValue).toBe(initial);
			expect(initial).toEqual(initialAppState);

			nextState.metrics.trackedMetrics.push("LABEL_CREATED");
			nextState.columns.selectedColumns.reverse();

			expect(appStore.metrics.trackedMetrics).toEqual(["EXCEPTION"]);
			expect(appStore.columns.selectedColumns).toEqual([
				{ name: "STATUS", sortDirection: "desc" },
				{ name: "TRACKING_ID" },
			]);
		});

		test("keeps slice stores connected and other application instances unchanged after replacement", () => {
			const first = new AppStore();
			const second = new AppStore();
			const secondInitial = second._state;
			const metrics = first.metrics;
			const columns = first.columns;

			first._state = {
				metrics: {
					focusedMetric: "EXCEPTION",
					trackedMetrics: ["EXCEPTION"],
				},
				columns: { selectedColumns: [{ name: "TRACKING_ID" }] },
			};

			expect(first.metrics).toBe(metrics);
			expect(first.columns).toBe(columns);
			expect(metrics.focusedMetric).toBe("EXCEPTION");
			expect(columns.selectedColumns).toEqual([{ name: "TRACKING_ID" }]);

			metrics.focusedMetric = "LABEL_CREATED";
			columns.selectedColumns = [{ name: "TRACKING_ID", sortDirection: "asc" }];

			expect(first._state.metrics.focusedMetric).toBe("LABEL_CREATED");
			expect(first._state.columns.selectedColumns).toEqual([
				{ name: "TRACKING_ID", sortDirection: "asc" },
			]);
			expect(second._state).toBe(secondInitial);
			expect(second._state).toEqual(initialAppState);
		});

		test.each([
			{ state: null },
			{ state: {} },
			{ state: { statistics: { selectedStatistics: [] } } },
			{ state: { columns: { selectedColumns: [{ name: "TRACKING_ID" }] } } },
			{
				state: {
					statistics: { selectedStatistics: ["UNKNOWN"] },
					columns: { selectedColumns: [{ name: "TRACKING_ID" }] },
				},
			},
			{
				state: {
					statistics: { selectedStatistics: [] },
					columns: { selectedColumns: [{ name: "status" }] },
				},
			},
		])(
			"rejects invalid full state without updating or notifying: $state",
			({ state }) => {
				const appStore = new AppStore();
				const initial = appStore._state;
				let notifications = 0;
				appStore.subscribe(
					(value) => value,
					() => {
						notifications += 1;
					},
				);

				expect(() => Reflect.set(appStore, "_state", state)).toThrow(ZodError);

				expect(appStore._state).toBe(initial);
				expect(notifications).toBe(0);
			},
		);
	});

	describe("initialization and state integration", () => {
		test("starts with the configured initial application state", () => {
			const appStore = new AppStore();

			expect(appStore._state).toEqual(initialAppState);
			expect(appStore.metrics.state).toBe(appStore._state.metrics);
			expect(appStore.columns.state).toBe(appStore._state.columns);
		});

		test("exposes a stable metrics state connected to the application state", () => {
			const appStore = new AppStore();
			const metrics = appStore.metrics;
			const initial = appStore._state;

			metrics.focusedMetric = "EXCEPTION";

			expect(appStore.metrics).toBe(metrics);
			expect(appStore._state.metrics.focusedMetric).toBe("EXCEPTION");
			expect(metrics.state).toBe(appStore._state.metrics);
			expect(appStore._state).not.toBe(initial);
		});

		test("keeps updates isolated between application-state instances", () => {
			const first = new AppStore();
			const second = new AppStore();
			const secondInitial = second._state;

			first.metrics.focusedMetric = "EXCEPTION";

			expect(second._state).toBe(secondInitial);
			expect(second._state).toEqual(initialAppState);
			expect(first._state).not.toBe(second._state);
		});

		test("exposes a stable columns state connected to the application state", () => {
			const appStore = new AppStore();
			const columns = appStore.columns;
			const initial = appStore._state;

			columns.selectedColumns = [
				{ name: "STATUS", sortDirection: "desc" },
				{ name: "TRACKING_ID" },
			];

			expect(appStore.columns).toBe(columns);
			expect(appStore._state.columns.selectedColumns).toEqual([
				{ name: "STATUS", sortDirection: "desc" },
				{ name: "TRACKING_ID" },
			]);
			expect(columns.state).toBe(appStore._state.columns);
			expect(appStore._state).not.toBe(initial);
			expect(appStore._state.metrics).toBe(initial.metrics);
			expect(initial.columns.selectedColumns).toEqual([
				{ name: "TRACKING_ID" },
				{ name: "STATUS" },
				{ name: "EST_DELIVERY" },
			]);
		});

		test("keeps columns updates isolated between application-state instances", () => {
			const first = new AppStore();
			const second = new AppStore();
			const secondInitial = second._state;

			first.columns.selectedColumns = [{ name: "TRACKING_ID" }];

			expect(first._state.columns.selectedColumns).toEqual([
				{ name: "TRACKING_ID" },
			]);
			expect(second._state).toBe(secondInitial);
			expect(second._state).toEqual(initialAppState);
			expect(first._state.columns).not.toBe(second._state.columns);
		});
	});

	describe("subscriptions", () => {
		test("emits new and previous columns only for columns updates until unsubscribed", () => {
			const appStore = new AppStore();
			const updates: Array<{
				value: AppState["columns"]["selectedColumns"];
				previousValue: AppState["columns"]["selectedColumns"];
			}> = [];
			const unsubscribe = appStore.subscribe(
				(state) => state.columns.selectedColumns,
				(value, previousValue) => updates.push({ value, previousValue }),
			);

			expect(updates).toEqual([]);

			appStore.columns.selectedColumns = [{ name: "TRACKING_ID" }];
			appStore.metrics.focusedMetric = "EXCEPTION";
			appStore.columns.selectedColumns = [
				{ name: "STATUS", sortDirection: "asc" },
				{ name: "TRACKING_ID" },
			];
			unsubscribe();
			appStore.columns.selectedColumns = [{ name: "TRACKING_ID" }];

			expect(updates).toEqual([
				{
					value: [{ name: "TRACKING_ID" }],
					previousValue: [
						{ name: "TRACKING_ID" },
						{ name: "STATUS" },
						{ name: "EST_DELIVERY" },
					],
				},
				{
					value: [
						{ name: "STATUS", sortDirection: "asc" },
						{ name: "TRACKING_ID" },
					],
					previousValue: [{ name: "TRACKING_ID" }],
				},
			]);
		});

		test("emits the selected new and previous values only when the selection changes", () => {
			const appStore = new AppStore();
			const updates: Array<{
				value: AppState["metrics"]["focusedMetric"];
				previousValue: AppState["metrics"]["focusedMetric"];
			}> = [];
			appStore.subscribe(
				(state) => state.metrics.focusedMetric,
				(value, previousValue) => updates.push({ value, previousValue }),
			);

			expect(updates).toEqual([]);

			appStore.metrics.focusedMetric = "EXCEPTION";
			appStore.metrics.trackedMetrics = ["EXCEPTION"];
			appStore.metrics.focusedMetric = "LABEL_CREATED";

			expect(updates).toEqual([
				{
					value: "EXCEPTION",
					previousValue: initialAppState.metrics.focusedMetric,
				},
				{
					value: "LABEL_CREATED",
					previousValue: "EXCEPTION",
				},
			]);
		});

		test("supports selecting and observing the entire application state", () => {
			const appStore = new AppStore();
			const initial = appStore._state;
			const updates: Array<{ value: AppState; previousValue: AppState }> = [];
			appStore.subscribe(
				(state) => state,
				(value, previousValue) => updates.push({ value, previousValue }),
			);

			appStore.metrics.trackedMetrics = ["EXCEPTION"];

			expect(updates).toHaveLength(1);
			expect(updates[0]?.value).toBe(appStore._state);
			expect(updates[0]?.previousValue).toBe(initial);
		});

		test("unsubscribes a listener without disconnecting other listeners", () => {
			const appStore = new AppStore();
			const unsubscribedUpdates: Array<AppState["metrics"]["trackedMetrics"]> =
				[];
			const activeUpdates: Array<AppState["metrics"]["trackedMetrics"]> = [];
			const unsubscribe = appStore.subscribe(
				(state) => state.metrics.trackedMetrics,
				(value) => unsubscribedUpdates.push(value),
			);
			appStore.subscribe(
				(state) => state.metrics.trackedMetrics,
				(value) => activeUpdates.push(value),
			);

			appStore.metrics.trackedMetrics = ["EXCEPTION"];
			unsubscribe();
			appStore.metrics.trackedMetrics = ["LABEL_CREATED"];

			expect(unsubscribedUpdates).toEqual([["EXCEPTION"]]);
			expect(activeUpdates).toEqual([["EXCEPTION"], ["LABEL_CREATED"]]);
		});
	});
});
