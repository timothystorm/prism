import { describe, expect, test } from "vitest";
import { type AppState, initialAppState } from "./app-state";
import { AppStore } from "./app-store";

describe("AppStore", () => {
	describe("initialization and store integration", () => {
		test("starts with the configured initial application store", () => {
			const appStore = new AppStore();

			expect(appStore.state).toEqual(initialAppState);
			expect(appStore.statistics.state).toBe(appStore.state.statistics);
			expect(appStore.columns.state).toBe(appStore.state.columns);
		});

		test("exposes a stable statistics store connected to the application store", () => {
			const appStore = new AppStore();
			const statistics = appStore.statistics;
			const initial = appStore.state;

			statistics.activeStatistic = "exceptions";

			expect(appStore.statistics).toBe(statistics);
			expect(appStore.state.statistics.activeStatistic).toBe("exceptions");
			expect(statistics.state).toBe(appStore.state.statistics);
			expect(appStore.state).not.toBe(initial);
		});

		test("keeps updates isolated between application-store instances", () => {
			const first = new AppStore();
			const second = new AppStore();
			const secondInitial = second.state;

			first.statistics.activeStatistic = "exceptions";

			expect(second.state).toBe(secondInitial);
			expect(second.state).toEqual(initialAppState);
			expect(first.state).not.toBe(second.state);
		});

		test("exposes a stable columns store connected to the application store", () => {
			const appStore = new AppStore();
			const columns = appStore.columns;
			const initial = appStore.state;

			columns.selectedColumns = [
				{ name: "status", sortDirection: "desc" },
				{ name: "trackId" },
			];

			expect(appStore.columns).toBe(columns);
			expect(appStore.state.columns.selectedColumns).toEqual([
				{ name: "status", sortDirection: "desc" },
				{ name: "trackId" },
			]);
			expect(columns.state).toBe(appStore.state.columns);
			expect(appStore.state).not.toBe(initial);
			expect(appStore.state.statistics).toBe(initial.statistics);
			expect(initial.columns.selectedColumns).toEqual([
				{ name: "trackId" },
				{ name: "status" },
				{ name: "estimatedDeliveryDate" },
			]);
		});

		test("keeps columns updates isolated between application-store instances", () => {
			const first = new AppStore();
			const second = new AppStore();
			const secondInitial = second.state;

			first.columns.selectedColumns = [{ name: "trackId" }];

			expect(first.state.columns.selectedColumns).toEqual([
				{ name: "trackId" },
			]);
			expect(second.state).toBe(secondInitial);
			expect(second.state).toEqual(initialAppState);
			expect(first.state.columns).not.toBe(second.state.columns);
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
			const initial = appStore.state;
			const updates: Array<{ value: AppState; previousValue: AppState }> = [];
			appStore.subscribe(
				(state) => state,
				(value, previousValue) => updates.push({ value, previousValue }),
			);

			appStore.statistics.activeStatistic = "exceptions";

			expect(updates).toHaveLength(1);
			expect(updates[0]?.value).toBe(appStore.state);
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
