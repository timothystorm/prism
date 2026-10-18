import { describe, expect, expectTypeOf, test } from "vitest";
import { ZodError } from "zod";
import { type AppState, initialAppState } from "./app-state";
import { AppStore } from "./app-store";

describe("AppStore", () => {
	describe("internal state replacement", () => {
		test("restores a JSON snapshot without changing supplied date strings", () => {
			const source = new AppStore();
			source.filters.addActiveFilter({
				type: "SHIPMENT:COMMIT_DATE",
				criteria: {
					start: "2026-10-17T16:05:02.359Z",
					end: "2026-10-17T17:30:45.012Z",
				},
			});
			const target = new AppStore();

			target._state = JSON.parse(JSON.stringify(source._state));

			expect(target.filters.state.active).toEqual([
				{
					type: "SHIPMENT:COMMIT_DATE",
					criteria: {
						start: "2026-10-17T16:05:02.359Z",
						end: "2026-10-17T17:30:45.012Z",
					},
				},
			]);
		});

		test("replaces the full state atomically without changing earlier snapshots or retaining input references", () => {
			const appStore = new AppStore();
			const initial = appStore._state;
			const nextState: AppState = {
				views: initialAppState.views,
				account: { active: ["accounts-1"], dirty: true },
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
			nextState.account.active.push("accounts-2");

			expect(appStore.account.state).toEqual({
				active: ["accounts-1"],
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
				views: initialAppState.views,
				account: { active: ["accounts-1"], dirty: false },
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
			expect(account.activeAccounts).toEqual(["accounts-1"]);
			expect(statuses.selectedStatuses).toEqual(["EXCEPTION:DAMAGED_PACKAGE"]);
			expect(metrics.focusedMetric).toBe("EXCEPTION");
			expect(columns.selectedColumns).toEqual([{ name: "TRACKING_ID" }]);

			metrics.focusedMetric = "LABEL_CREATED";
			columns.selectedColumns = [{ name: "TRACKING_ID", sortDirection: "asc" }];
			statuses.selectedStatuses = ["DELIVERED"];
			account.activeAccounts = ["accounts-2"];
			filters.addActiveFilter({
				type: "SHIPMENT:DELIVERY_PREDICTION",
				criteria: "DELAYED",
			});

			expect(first._state.metrics.focusedMetric).toBe("LABEL_CREATED");
			expect(first._state.account.active).toEqual(["accounts-2"]);
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
					account: { active: ["accounts-1", "accounts-1"] },
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
		test("integrates views with subscriptions, snapshots, and isolated instances", () => {
			const first = new AppStore();
			const second = new AppStore();
			const views = first.views;
			const initial = first._state;
			const updates: string[] = [];
			const unsubscribe = first.subscribe(
				(state) => state.views.current,
				(value) => updates.push(value),
			);

			views.custom = [{ id: "view-1", name: "My view" }];
			views.current = "view-1";
			first.metrics.focusedMetric = "EXCEPTION";
			unsubscribe();
			views.current = "default";

			expect(updates).toEqual(["view-1"]);
			expect(initial.views).toEqual(initialAppState.views);
			expect(second.views.state).toEqual(initialAppState.views);
			expect(first.views.state).toBe(first._state.views);

			first._state = JSON.parse(JSON.stringify(first._state));
			expect(first.views).toBe(views);
			expect(first.views.state).toEqual({
				custom: [{ id: "view-1", name: "My view" }],
				current: "default",
				dirty: false,
			});
			views.current = "view-1";
			expect(first._state.views.current).toBe("view-1");
		});

		test("restores snapshots with a current identifier outside the custom views", () => {
			const appStore = new AppStore();
			const initial = appStore._state;

			appStore._state = {
				...initial,
				views: { custom: [], current: "missing", dirty: true },
			};

			expect(appStore.views.state).toEqual({
				custom: [],
				current: "missing",
				dirty: true,
			});
			expect(initial).toEqual(initialAppState);
		});

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

		test("notifies active-accounts subscribers only for accounts selections and supports unsubscribe", () => {
			const appStore = new AppStore();
			const updates: string[][] = [];
			const previous: string[][] = [];
			const unsubscribe = appStore.subscribe(
				(state) => state.account.active,
				(value, previousValue) => {
					updates.push(value);
					previous.push(previousValue);
				},
			);

			appStore.account.activeAccounts = ["accounts-1", "accounts-2"];
			appStore.metrics.focusedMetric = "EXCEPTION";
			appStore.account.activeAccounts = [];
			unsubscribe();
			appStore.account.activeAccounts = ["accounts-3"];

			expect(updates).toEqual([["accounts-1", "accounts-2"], []]);
			expect(previous).toEqual([[], ["accounts-1", "accounts-2"]]);
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
		test("infers heterogeneous selector tuples and previous values", () => {
			const appStore = new AppStore();
			const unsubscribe = appStore.subscribe(
				[
					(state) => state.metrics.focusedMetric,
					(state) => state.columns,
					(state) => state.filters.active,
					(state) => state.account,
				],
				(value, previousValue) => {
					expectTypeOf(value).toEqualTypeOf<
						[
							AppState["metrics"]["focusedMetric"],
							AppState["columns"],
							AppState["filters"]["active"],
							AppState["account"],
						]
					>();
					expectTypeOf(previousValue).toEqualTypeOf<typeof value>();
					const [metric, columns, filters, account] = value;
					expectTypeOf(metric).toEqualTypeOf<
						AppState["metrics"]["focusedMetric"]
					>();
					expectTypeOf(columns).toEqualTypeOf<AppState["columns"]>();
					expectTypeOf(filters).toEqualTypeOf<AppState["filters"]["active"]>();
					expectTypeOf(account).toEqualTypeOf<AppState["account"]>();
				},
			);
			expectTypeOf(unsubscribe).toEqualTypeOf<() => void>();
			unsubscribe();

			const selectors = [
				(state: AppState) => state.columns,
				(state: AppState) => state.account,
			] as const;
			appStore.subscribe(selectors, ([columns, account]) => {
				expectTypeOf(columns).toEqualTypeOf<AppState["columns"]>();
				expectTypeOf(account).toEqualTypeOf<AppState["account"]>();
			})();

			const invalidCalls = () => {
				// @ts-expect-error Selector tuples cannot be empty.
				appStore.subscribe([], () => {});
				// @ts-expect-error The listener must match the selected element type.
				appStore.subscribe(
					[(state: AppState) => state.columns],
					(_value: [string]) => {},
				);
			};
			void invalidCalls;
		});

		test("emits complete ordered tuples only when selected values change", () => {
			const appStore = new AppStore();
			type Selection = [
				AppState["metrics"]["focusedMetric"],
				AppState["account"]["active"],
			];
			const updates: Array<{ value: Selection; previousValue: Selection }> = [];
			appStore.subscribe(
				[
					(state) => state.metrics.focusedMetric,
					(state) => state.account.active,
				],
				(value, previousValue) => updates.push({ value, previousValue }),
			);

			expect(updates).toEqual([]);
			appStore.columns.selectedColumns = [{ name: "TRACKING_ID" }];
			expect(updates).toEqual([]);

			appStore.metrics.focusedMetric = "EXCEPTION";
			appStore.account.activeAccounts = ["accounts-1"];

			expect(updates).toEqual([
				{
					value: ["EXCEPTION", []],
					previousValue: [initialAppState.metrics.focusedMetric, []],
				},
				{
					value: ["EXCEPTION", ["accounts-1"]],
					previousValue: ["EXCEPTION", []],
				},
			]);
		});

		test("supports a one-element selector tuple and unsubscribe", () => {
			const appStore = new AppStore();
			const updates: string[][] = [];
			const unsubscribe = appStore.subscribe(
				[(state) => state.account.active],
				([accounts], [previousAccounts]) => {
					expectTypeOf(accounts).toEqualTypeOf<string[]>();
					expectTypeOf(previousAccounts).toEqualTypeOf<string[]>();
					updates.push(accounts);
				},
			);

			appStore.account.activeAccounts = ["accounts-1"];
			unsubscribe();
			appStore.account.activeAccounts = ["accounts-2"];

			expect(updates).toEqual([["accounts-1"]]);
		});

		test("notifies once with a consistent tuple for an atomic state replacement", () => {
			const appStore = new AppStore();
			type Selection = [AppState["columns"], AppState["account"]];
			const updates: Array<{ value: Selection; previousValue: Selection }> = [];
			const initial = appStore._state;
			appStore.subscribe(
				[(state) => state.columns, (state) => state.account],
				(value, previousValue) => updates.push({ value, previousValue }),
			);

			appStore._state = {
				...initial,
				columns: { selectedColumns: [{ name: "TRACKING_ID" }] },
				account: { active: ["accounts-1"], dirty: true },
			};

			expect(updates).toEqual([
				{
					value: [
						{ selectedColumns: [{ name: "TRACKING_ID" }] },
						{ active: ["accounts-1"], dirty: true },
					],
					previousValue: [initial.columns, initial.account],
				},
			]);
			expect(updates[0]?.value[0]).toBe(appStore._state.columns);
			expect(updates[0]?.value[1]).toBe(appStore._state.account);
			expect(updates[0]?.previousValue[0]).toBe(initial.columns);
			expect(updates[0]?.previousValue[1]).toBe(initial.account);
		});

		test("treats newly allocated selector results as changes", () => {
			const appStore = new AppStore();
			const updates: Array<{
				value: { accounts: string[] };
				previousValue: { accounts: string[] };
			}> = [];
			appStore.subscribe(
				[(state) => ({ accounts: state.account.active })],
				([value], [previousValue]) => updates.push({ value, previousValue }),
			);

			appStore.metrics.focusedMetric = "EXCEPTION";

			expect(updates).toEqual([
				{ value: { accounts: [] }, previousValue: { accounts: [] } },
			]);
			expect(updates[0]?.value).not.toBe(updates[0]?.previousValue);
			expect(updates[0]?.value.accounts).toBe(
				updates[0]?.previousValue.accounts,
			);
		});

		test("notifies for equal selected data with distinct references", () => {
			const appStore = new AppStore();
			const initial = appStore._state;
			const updates: Array<{ value: string[]; previousValue: string[] }> = [];
			appStore.subscribe(
				[(state) => state.account.active],
				([value], [previousValue]) => updates.push({ value, previousValue }),
			);

			appStore._state = JSON.parse(JSON.stringify(initial));

			expect(updates).toEqual([{ value: [], previousValue: [] }]);
			expect(updates[0]?.value).toBe(appStore.account.activeAccounts);
			expect(updates[0]?.previousValue).toBe(initial.account.active);
			expect(updates[0]?.value).not.toBe(updates[0]?.previousValue);
		});

		test("unsubscribes a tuple listener without affecting independent subscribers", () => {
			const appStore = new AppStore();
			const tupleUpdates: string[][] = [];
			const singleUpdates: string[][] = [];
			const unsubscribe = appStore.subscribe(
				[(state) => state.account.active, (state) => state.columns],
				([accounts]) => tupleUpdates.push(accounts),
			);
			const unsubscribeSingle = appStore.subscribe(
				(state) => state.account.active,
				(accounts) => singleUpdates.push(accounts),
			);

			appStore.account.activeAccounts = ["accounts-1"];
			unsubscribe();
			appStore.account.activeAccounts = ["accounts-2"];

			expect(tupleUpdates).toEqual([["accounts-1"]]);
			expect(singleUpdates).toEqual([["accounts-1"], ["accounts-2"]]);
			unsubscribeSingle();
		});

		test("captures selectors independently of later caller mutations", () => {
			const appStore = new AppStore();
			const selectors: [(state: AppState) => string[]] = [
				(state) => state.account.active,
			];
			const updates: string[][] = [];
			appStore.subscribe(selectors, ([accounts]) => updates.push(accounts));

			selectors[0] = (state) => state.statuses.selectedStatuses;
			appStore.statuses.selectedStatuses = ["DELIVERED"];
			expect(updates).toEqual([]);

			appStore.account.activeAccounts = ["accounts-1"];
			expect(updates).toEqual([["accounts-1"]]);
		});

		test("rejects an empty selector array when types are bypassed", () => {
			const appStore = new AppStore();

			expect(() =>
				Reflect.apply(appStore.subscribe, appStore, [[], () => {}]),
			).toThrow(TypeError);
		});

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
