import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { type AppState, initialAppState } from "./app-state";
import { AppStore } from "./app-store";

describe("AppStore", () => {
	describe("internal state replacement", () => {
		test("restores a snapshot containing a converted date filter", () => {
			const source = new AppStore();
			source.filters.addActiveFilter({
				type: "SHIPMENT:COMMIT_DATE",
				criteria: {
					start: "2026-10-17",
					end: "2026-10-17",
					timeZone: "UTC",
				},
			});
			const target = new AppStore();

			target._state = source._state;

			expect(target.filters.state.active).toEqual([
				{
					type: "SHIPMENT:COMMIT_DATE",
					criteria: {
						start: new Date("2026-10-17T00:00:00.000Z"),
						end: new Date("2026-10-17T23:59:59.999Z"),
					},
				},
			]);
		});

		test("replaces the full state atomically without changing earlier snapshots or retaining input references", () => {
			const appStore = new AppStore();
			const initial = appStore._state;
			const nextState: AppState = {
				account: { activeAccounts: ["account-1"], dirty: true },
				filters: initialAppState.filters,
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
				statuses: {
					selectedStatuses: ["LABEL_CREATED", "EXCEPTION:DAMAGED_PACKAGE"],
					dirty: true,
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
			nextState.statuses.selectedStatuses.push("DELIVERED");
			nextState.account.activeAccounts.push("account-2");

			expect(appStore.account.state).toEqual({
				activeAccounts: ["account-1"],
				dirty: true,
			});
			expect(appStore.metrics.trackedMetrics).toEqual(["EXCEPTION"]);
			expect(appStore.columns.selectedColumns).toEqual([
				{ name: "STATUS", sortDirection: "desc" },
				{ name: "TRACKING_ID" },
			]);
			expect(appStore.statuses.selectedStatuses).toEqual([
				"LABEL_CREATED",
				"EXCEPTION:DAMAGED_PACKAGE",
			]);
			expect(appStore.statuses.state.dirty).toBe(true);
		});

		test("keeps slice stores connected and other application instances unchanged after replacement", () => {
			const first = new AppStore();
			const second = new AppStore();
			const secondInitial = second._state;
			const metrics = first.metrics;
			const columns = first.columns;
			const statuses = first.statuses;
			const filters = first.filters;
			const account = first.account;

			first._state = {
				account: { activeAccounts: ["account-1"], dirty: false },
				filters: initialAppState.filters,
				metrics: {
					focusedMetric: "EXCEPTION",
					trackedMetrics: ["EXCEPTION"],
				},
				columns: { selectedColumns: [{ name: "TRACKING_ID" }] },
				statuses: {
					selectedStatuses: ["EXCEPTION:DAMAGED_PACKAGE"],
					dirty: false,
				},
			};

			expect(first.metrics).toBe(metrics);
			expect(first.columns).toBe(columns);
			expect(first.statuses).toBe(statuses);
			expect(first.filters).toBe(filters);
			expect(first.account).toBe(account);
			expect(account.activeAccounts).toEqual(["account-1"]);
			expect(statuses.selectedStatuses).toEqual(["EXCEPTION:DAMAGED_PACKAGE"]);
			expect(metrics.focusedMetric).toBe("EXCEPTION");
			expect(columns.selectedColumns).toEqual([{ name: "TRACKING_ID" }]);

			metrics.focusedMetric = "LABEL_CREATED";
			columns.selectedColumns = [{ name: "TRACKING_ID", sortDirection: "asc" }];
			statuses.selectedStatuses = ["DELIVERED"];
			account.activeAccounts = ["account-2"];
			filters.addActiveFilter({
				type: "SHIPMENT:DELIVERY_PREDICTION",
				criteria: "DELAYED",
			});

			expect(first._state.metrics.focusedMetric).toBe("LABEL_CREATED");
			expect(first._state.account.activeAccounts).toEqual(["account-2"]);
			expect(first._state.columns.selectedColumns).toEqual([
				{ name: "TRACKING_ID", sortDirection: "asc" },
			]);
			expect(first._state.statuses.selectedStatuses).toEqual(["DELIVERED"]);
			expect(first._state.filters.active).toEqual([
				{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "DELAYED" },
			]);
			expect(second._state).toBe(secondInitial);
			expect(second._state).toEqual(initialAppState);
		});

		test.each([
			{
				state: {
					...initialAppState,
					account: { activeAccounts: ["account-1", "account-1"] },
				},
			},
			{ state: null },
			{ state: {} },
			{ state: { statistics: { selectedStatistics: [] } } },
			{ state: { columns: { selectedColumns: [{ name: "TRACKING_ID" }] } } },
			{
				state: {
					metrics: initialAppState.metrics,
					columns: initialAppState.columns,
				},
			},
			{
				state: {
					...initialAppState,
					statuses: { selectedStatuses: ["UNKNOWN"] },
				},
			},
			{
				state: {
					...initialAppState,
					filters: {
						active: [{ type: "SHIPMENT:INVOICE_NUMBER", criteria: [] }],
						dirty: false,
					},
				},
			},
			{
				state: {
					...initialAppState,
					filters: {
						active: [
							{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-1"] },
							{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-2"] },
						],
						dirty: true,
					},
				},
			},
			{
				state: {
					...initialAppState,
					statuses: { selectedStatuses: ["EXCEPTION:LABEL_EXPIRED"] },
				},
			},
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
			expect(appStore.account.state).toBe(appStore._state.account);
			expect(appStore.account.activeAccounts).toEqual([]);
			expect(appStore.metrics.state).toBe(appStore._state.metrics);
			expect(appStore.columns.state).toBe(appStore._state.columns);
			expect(appStore.statuses.state).toBe(appStore._state.statuses);
			expect(appStore.statuses.selectedStatuses).toEqual([]);
			expect(appStore.statuses.state.dirty).toBe(false);
		});

		test("notifies active-account subscribers only for account selections and supports unsubscribe", () => {
			const appStore = new AppStore();
			const updates: string[][] = [];
			const previous: string[][] = [];
			const unsubscribe = appStore.subscribe(
				(state) => state.account.activeAccounts,
				(value, previousValue) => {
					updates.push(value);
					previous.push(previousValue);
				},
			);

			appStore.account.activeAccounts = ["account-1", "account-2"];
			appStore.metrics.focusedMetric = "EXCEPTION";
			appStore.account.activeAccounts = [];
			unsubscribe();
			appStore.account.activeAccounts = ["account-3"];

			expect(updates).toEqual([["account-1", "account-2"], []]);
			expect(previous).toEqual([[], ["account-1", "account-2"]]);
		});

		test("exposes a stable statuses store connected to application state without changing other slices or snapshots", () => {
			const appStore = new AppStore();
			const statuses = appStore.statuses;
			const initial = appStore._state;

			statuses.selectedStatuses = [
				"LABEL_CREATED",
				"EXCEPTION:DAMAGED_PACKAGE",
			];

			expect(appStore.statuses).toBe(statuses);
			expect(statuses.state).toBe(appStore._state.statuses);
			expect(appStore._state.statuses.selectedStatuses).toEqual([
				"LABEL_CREATED",
				"EXCEPTION:DAMAGED_PACKAGE",
			]);
			expect(initial.statuses.selectedStatuses).toEqual([]);
			expect(appStore._state.metrics).toBe(initial.metrics);
			expect(appStore._state.columns).toBe(initial.columns);
		});

		test("keeps status updates isolated between application-state instances", () => {
			const first = new AppStore();
			const second = new AppStore();
			const secondInitial = second._state;

			first.statuses.selectedStatuses = ["DELIVERED"];

			expect(first._state.statuses.selectedStatuses).toEqual(["DELIVERED"]);
			expect(second._state).toBe(secondInitial);
			expect(second.statuses.selectedStatuses).toEqual([]);
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
		test("observes filter changes but not duplicate additions, missing removals, or other slices", () => {
			const first = new AppStore();
			const second = new AppStore();
			const initial = first._state;
			const filters = first.filters;
			const updates: Array<{
				value: AppState["filters"]["active"];
				previousValue: AppState["filters"]["active"];
			}> = [];
			const unsubscribe = first.subscribe(
				(state) => state.filters.active,
				(value, previousValue) => updates.push({ value, previousValue }),
			);

			filters.addActiveFilter({
				type: "SHIPMENT:DELIVERY_PREDICTION",
				criteria: "ON_TIME",
			});
			filters.addActiveFilter({
				type: "SHIPMENT:DELIVERY_PREDICTION",
				criteria: "ON_TIME",
			});
			filters.removeActiveFilter("SHIPMENT:INVOICE_NUMBER");
			first.metrics.focusedMetric = "EXCEPTION";
			filters.removeActiveFilter("SHIPMENT:DELIVERY_PREDICTION");
			unsubscribe();
			filters.addActiveFilter({
				type: "SHIPMENT:SIGNATURE_AVAILABLE",
				criteria: true,
			});

			expect(updates).toEqual([
				{
					value: [
						{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" },
					],
					previousValue: [],
				},
				{
					value: [],
					previousValue: [
						{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" },
					],
				},
			]);
			expect(first.filters).toBe(filters);
			expect(initial.filters).toEqual({ active: [], dirty: false });
			expect(second.filters.state).toBe(second._state.filters);
			expect(second.filters.state).toEqual({ active: [], dirty: false });
		});

		test("emits new and previous status selections only for status updates until unsubscribed", () => {
			const appStore = new AppStore();
			const updates: Array<{
				value: AppState["statuses"]["selectedStatuses"];
				previousValue: AppState["statuses"]["selectedStatuses"];
			}> = [];
			const unsubscribe = appStore.subscribe(
				(state) => state.statuses.selectedStatuses,
				(value, previousValue) => updates.push({ value, previousValue }),
			);

			expect(updates).toEqual([]);
			appStore.statuses.selectedStatuses = ["LABEL_CREATED"];
			appStore.metrics.focusedMetric = "EXCEPTION";
			appStore.columns.selectedColumns = [{ name: "TRACKING_ID" }];
			appStore.statuses.selectedStatuses = [];
			unsubscribe();
			appStore.statuses.selectedStatuses = ["DELIVERED"];

			expect(updates).toEqual([
				{ value: ["LABEL_CREATED"], previousValue: [] },
				{ value: [], previousValue: ["LABEL_CREATED"] },
			]);
		});

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
