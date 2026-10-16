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
				statistics: {
					activeStatistic: "exceptions",
					selectedStatistics: ["exceptions"],
				},
				columns: {
					selectedColumns: [
						{ name: "status", sortDirection: "desc" },
						{ name: "trackId" },
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

			nextState.statistics.selectedStatistics.push("label_created");
			nextState.columns.selectedColumns.reverse();

			expect(appStore.statistics.selectedStatistics).toEqual(["exceptions"]);
			expect(appStore.columns.selectedColumns).toEqual([
				{ name: "status", sortDirection: "desc" },
				{ name: "trackId" },
			]);
		});

		test("keeps slice stores connected and other application instances unchanged after replacement", () => {
			const first = new AppStore();
			const second = new AppStore();
			const secondInitial = second._state;
			const statistics = first.statistics;
			const columns = first.columns;

			first._state = {
				statistics: {
					activeStatistic: "exceptions",
					selectedStatistics: ["exceptions"],
				},
				columns: { selectedColumns: [{ name: "trackId" }] },
			};

			expect(first.statistics).toBe(statistics);
			expect(first.columns).toBe(columns);
			expect(statistics.activeStatistic).toBe("exceptions");
			expect(columns.selectedColumns).toEqual([{ name: "trackId" }]);

			statistics.activeStatistic = "label_created";
			columns.selectedColumns = [{ name: "trackId", sortDirection: "asc" }];

			expect(first._state.statistics.activeStatistic).toBe("label_created");
			expect(first._state.columns.selectedColumns).toEqual([
				{ name: "trackId", sortDirection: "asc" },
			]);
			expect(second._state).toBe(secondInitial);
			expect(second._state).toEqual(initialAppState);
		});

		test.each([
			{ state: null },
			{ state: {} },
			{ state: { statistics: { selectedStatistics: [] } } },
			{ state: { columns: { selectedColumns: [{ name: "trackId" }] } } },
			{
				state: {
					statistics: { selectedStatistics: ["unknown"] },
					columns: { selectedColumns: [{ name: "trackId" }] },
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

	describe("initialization and store integration", () => {
		test("starts with the configured initial application store", () => {
			const appStore = new AppStore();

			expect(appStore._state).toEqual(initialAppState);
			expect(appStore.statistics.state).toBe(appStore._state.statistics);
			expect(appStore.columns.state).toBe(appStore._state.columns);
		});

		test("exposes a stable statistics store connected to the application store", () => {
			const appStore = new AppStore();
			const statistics = appStore.statistics;
			const initial = appStore._state;

			statistics.activeStatistic = "exceptions";

			expect(appStore.statistics).toBe(statistics);
			expect(appStore._state.statistics.activeStatistic).toBe("exceptions");
			expect(statistics.state).toBe(appStore._state.statistics);
			expect(appStore._state).not.toBe(initial);
		});

		test("keeps updates isolated between application-store instances", () => {
			const first = new AppStore();
			const second = new AppStore();
			const secondInitial = second._state;

			first.statistics.activeStatistic = "exceptions";

			expect(second._state).toBe(secondInitial);
			expect(second._state).toEqual(initialAppState);
			expect(first._state).not.toBe(second._state);
		});

		test("exposes a stable columns store connected to the application store", () => {
			const appStore = new AppStore();
			const columns = appStore.columns;
			const initial = appStore._state;

			columns.selectedColumns = [
				{ name: "status", sortDirection: "desc" },
				{ name: "trackId" },
			];

			expect(appStore.columns).toBe(columns);
			expect(appStore._state.columns.selectedColumns).toEqual([
				{ name: "status", sortDirection: "desc" },
				{ name: "trackId" },
			]);
			expect(columns.state).toBe(appStore._state.columns);
			expect(appStore._state).not.toBe(initial);
			expect(appStore._state.statistics).toBe(initial.statistics);
			expect(initial.columns.selectedColumns).toEqual([
				{ name: "trackId" },
				{ name: "status" },
				{ name: "estimatedDeliveryDate" },
			]);
		});

		test("keeps columns updates isolated between application-store instances", () => {
			const first = new AppStore();
			const second = new AppStore();
			const secondInitial = second._state;

			first.columns.selectedColumns = [{ name: "trackId" }];

			expect(first._state.columns.selectedColumns).toEqual([
				{ name: "trackId" },
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

			appStore.columns.selectedColumns = [{ name: "trackId" }];
			appStore.statistics.activeStatistic = "exceptions";
			appStore.columns.selectedColumns = [
				{ name: "status", sortDirection: "asc" },
				{ name: "trackId" },
			];
			unsubscribe();
			appStore.columns.selectedColumns = [{ name: "trackId" }];

			expect(updates).toEqual([
				{
					value: [{ name: "trackId" }],
					previousValue: [
						{ name: "trackId" },
						{ name: "status" },
						{ name: "estimatedDeliveryDate" },
					],
				},
				{
					value: [
						{ name: "status", sortDirection: "asc" },
						{ name: "trackId" },
					],
					previousValue: [{ name: "trackId" }],
				},
			]);
		});

		test("emits the selected new and previous values only when the selection changes", () => {
			const appStore = new AppStore();
			const updates: Array<{
				value: AppState["statistics"]["activeStatistic"];
				previousValue: AppState["statistics"]["activeStatistic"];
			}> = [];
			appStore.subscribe(
				(state) => state.statistics.activeStatistic,
				(value, previousValue) => updates.push({ value, previousValue }),
			);

			expect(updates).toEqual([]);

			appStore.statistics.activeStatistic = "exceptions";
			appStore.statistics.selectedStatistics = ["exceptions"];
			appStore.statistics.activeStatistic = "label_created";

			expect(updates).toEqual([
				{
					value: "exceptions",
					previousValue: initialAppState.statistics.activeStatistic,
				},
				{
					value: "label_created",
					previousValue: "exceptions",
				},
			]);
		});

		test("supports selecting and observing the entire application store", () => {
			const appStore = new AppStore();
			const initial = appStore._state;
			const updates: Array<{ value: AppState; previousValue: AppState }> = [];
			appStore.subscribe(
				(state) => state,
				(value, previousValue) => updates.push({ value, previousValue }),
			);

			appStore.statistics.activeStatistic = "exceptions";

			expect(updates).toHaveLength(1);
			expect(updates[0]?.value).toBe(appStore._state);
			expect(updates[0]?.previousValue).toBe(initial);
		});

		test("unsubscribes a listener without disconnecting other listeners", () => {
			const appStore = new AppStore();
			const unsubscribedUpdates: Array<
				AppState["statistics"]["activeStatistic"]
			> = [];
			const activeUpdates: Array<AppState["statistics"]["activeStatistic"]> =
				[];
			const unsubscribe = appStore.subscribe(
				(state) => state.statistics.activeStatistic,
				(value) => unsubscribedUpdates.push(value),
			);
			appStore.subscribe(
				(state) => state.statistics.activeStatistic,
				(value) => activeUpdates.push(value),
			);

			appStore.statistics.activeStatistic = "exceptions";
			unsubscribe();
			appStore.statistics.activeStatistic = "label_created";

			expect(unsubscribedUpdates).toEqual(["exceptions"]);
			expect(activeUpdates).toEqual(["exceptions", "label_created"]);
		});
	});
});
