import { describe, expect, expectTypeOf, test } from "vitest";
import { ZodError } from "zod";
import { type AppState, initialAppState } from "./app-state";
import { AppStore, SearchStateSchema } from "./index";

describe("AppStore", () => {
  describe("getState/setState", () => {
    test("restores a JSON snapshot without changing supplied date strings", () => {
      const source = new AppStore();
      source.filters.setActiveFilters([
        {
          type: "SHIPMENT:COMMIT_DATE",
          criteria: {
            start: "2026-10-17",
            end: "2026-10-17",
          },
        },
      ]);
      const target = new AppStore();

      target.setState(JSON.parse(JSON.stringify(source.getState())));

      expect(target.filters.getState().activeFilters).toEqual([
        {
          type: "SHIPMENT:COMMIT_DATE",
          criteria: {
            start: "2026-10-17",
            end: "2026-10-17",
          },
        },
      ]);
    });

    test("replaces the full state atomically without changing earlier snapshots or retaining input references", () => {
      const appStore = new AppStore();
      const initial = appStore.getState();
      const nextState: AppState = {
        views: { activeView: "delayed", dirty: true },
        search: { query: "Chicago", category: "DESTINATION_CITY", dirty: true },
        account: { activeAccounts: ["accounts-1"], dirty: true },
        filters: {
          activeFilters: [{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "DELAYED" }],
          dirty: true,
        },
        metrics: {
          activeMetric: "EXCEPTION",
          selectedMetrics: ["EXCEPTION"],
          dirty: true,
        },
        columns: {
          activeColumns: [{ name: "STATUS", sortDirection: "desc" }, { name: "TRACKING_ID" }],
          dirty: true,
        },
        statuses: {
          activeStatuses: ["LABEL_CREATED", "EXCEPTION:DAMAGED_PACKAGE"],
          dirty: true,
        },
      };
      const updates: Array<{ value: AppState; previousValue: AppState }> = [];
      appStore.subscribe(
        (state) => state,
        (value, previousValue) => updates.push({ value, previousValue }),
      );

      appStore.setState(nextState);

      expect(appStore.getState()).toEqual(nextState);
      expect(updates).toHaveLength(2);
      expect(updates[0]).toEqual({ value: initial, previousValue: initial });
      expect(updates[1]?.value).toBe(appStore.getState());
      expect(updates[1]?.previousValue).toBe(initial);
      expect(initial).toEqual(initialAppState);

      nextState.metrics.selectedMetrics.push("LABEL_CREATED");
      nextState.columns.activeColumns.reverse();
      nextState.statuses.activeStatuses.push("DELIVERED");
      nextState.account.activeAccounts.push("accounts-2");
      nextState.filters.activeFilters.push({
        type: "SHIPMENT:SIGNATURE_AVAILABLE",
        criteria: true,
      });
      nextState.views.activeView = "mutated";

      expect(appStore.account.getState()).toEqual({
        activeAccounts: ["accounts-1"],
        dirty: true,
      });
      expect(appStore.metrics.getSelectedMetrics()).toEqual(["EXCEPTION"]);
      expect(appStore.metrics.getState().dirty).toBe(true);
      expect(appStore.columns.getActiveColumns()).toEqual([
        { name: "STATUS", sortDirection: "desc" },
        { name: "TRACKING_ID" },
      ]);
      expect(appStore.columns.getState().dirty).toBe(true);
      expect(appStore.statuses.getActiveStatuses()).toEqual([
        "LABEL_CREATED",
        "EXCEPTION:DAMAGED_PACKAGE",
      ]);
      expect(appStore.statuses.getState().dirty).toBe(true);
      expect(appStore.filters.getState()).toEqual({
        activeFilters: [{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "DELAYED" }],
        dirty: true,
      });
      expect(appStore.views.getState()).toEqual({
        activeView: "delayed",
        dirty: true,
      });
    });

    test.each([
      { selectedMetrics: [], dirty: true },
      { activeMetric: undefined, selectedMetrics: [], dirty: true },
    ])("normalizes a missing active metric before publishing: %j", (metrics) => {
      const appStore = new AppStore();
      appStore.metrics.setActiveMetric("EXCEPTION");
      const updates: Array<{
        raw: AppState["metrics"]["activeMetric"];
        getter: ReturnType<typeof appStore.metrics.getActiveMetric>;
      }> = [];
      appStore.subscribe(
        (state) => state.metrics.activeMetric,
        (raw) => updates.push({ raw, getter: appStore.metrics.getActiveMetric() }),
      );

      Reflect.apply(appStore.setState, appStore, [{ ...appStore.getState(), metrics }]);

      expect(updates).toEqual([
        { raw: "EXCEPTION", getter: "EXCEPTION" },
        { raw: null, getter: null },
      ]);
      expect(appStore.metrics.getState()).toEqual({
        activeMetric: null,
        selectedMetrics: [],
        dirty: true,
      });
    });

    test("keeps slice stores connected and other application instances unchanged after replacement", () => {
      const first = new AppStore();
      const second = new AppStore();
      const secondInitial = second.getState();
      const metrics = first.metrics;
      const columns = first.columns;
      const statuses = first.statuses;
      const filters = first.filters;
      const account = first.account;

      first.setState({
        views: initialAppState.views,
        search: initialAppState.search,
        account: { activeAccounts: ["accounts-1"], dirty: false },
        filters: initialAppState.filters,
        metrics: {
          activeMetric: "EXCEPTION",
          selectedMetrics: ["EXCEPTION"],
          dirty: false,
        },
        columns: { activeColumns: [{ name: "TRACKING_ID" }], dirty: false },
        statuses: {
          activeStatuses: ["EXCEPTION:DAMAGED_PACKAGE"],
          dirty: false,
        },
      });

      expect(first.metrics).toBe(metrics);
      expect(first.columns).toBe(columns);
      expect(first.statuses).toBe(statuses);
      expect(first.filters).toBe(filters);
      expect(first.account).toBe(account);
      expect(account.getActiveAccounts()).toEqual(["accounts-1"]);
      expect(statuses.getActiveStatuses()).toEqual(["EXCEPTION:DAMAGED_PACKAGE"]);
      expect(metrics.getActiveMetric()).toBe("EXCEPTION");
      expect(columns.getActiveColumns()).toEqual([{ name: "TRACKING_ID" }]);

      metrics.setActiveMetric("LABEL_CREATED");
      columns.setActiveColumns([{ name: "TRACKING_ID", sortDirection: "asc" }]);
      statuses.setActiveStatuses(["DELIVERED"]);
      account.setActiveAccounts(["accounts-2"]);
      filters.setActiveFilters([
        {
          type: "SHIPMENT:DELIVERY_PREDICTION",
          criteria: "DELAYED",
        },
      ]);

      expect(first.getState().metrics.activeMetric).toBe("LABEL_CREATED");
      expect(first.getState().account.activeAccounts).toEqual(["accounts-2"]);
      expect(first.getState().columns.activeColumns).toEqual([
        { name: "TRACKING_ID", sortDirection: "asc" },
      ]);
      expect(first.getState().statuses.activeStatuses).toEqual(["DELIVERED"]);
      expect(first.getState().filters.activeFilters).toEqual([
        { type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "DELAYED" },
      ]);
      expect(second.getState()).toBe(secondInitial);
      expect(second.getState()).toEqual(initialAppState);
    });

    test.each([
      {
        state: {
          ...initialAppState,
          views: { activeView: "uncommitted", dirty: true },
          search: { query: "123", category: "UNKNOWN", dirty: true },
        },
      },
      { state: { ...initialAppState, search: undefined } },
      {
        state: {
          ...initialAppState,
          account: { activeAccounts: ["accounts-1", "accounts-1"] },
        },
      },
      { state: null },
      { state: {} },
      { state: { statistics: { selectedStatistics: [] } } },
      { state: { columns: { activeColumns: [{ name: "TRACKING_ID" }] } } },
      {
        state: {
          metrics: initialAppState.metrics,
          columns: initialAppState.columns,
        },
      },
      {
        state: {
          ...initialAppState,
          statuses: { activeStatuses: ["UNKNOWN"] },
        },
      },
      {
        state: {
          ...initialAppState,
          filters: {
            activeFilters: [{ type: "SHIPMENT:INVOICE_NUMBER", criteria: [] }],
            dirty: false,
          },
        },
      },
      {
        state: {
          ...initialAppState,
          filters: {
            activeFilters: [
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
          statuses: { activeStatuses: ["EXCEPTION:LABEL_EXPIRED"] },
        },
      },
      {
        state: {
          statistics: { selectedStatistics: ["UNKNOWN"] },
          columns: { activeColumns: [{ name: "TRACKING_ID" }], dirty: false },
        },
      },
      {
        state: {
          statistics: { selectedStatistics: [] },
          columns: { activeColumns: [{ name: "status" }] },
        },
      },
    ])("rejects invalid full state without updating or notifying: $state", ({ state }) => {
      const appStore = new AppStore();
      const initial = appStore.getState();
      let notifications = 0;
      appStore.subscribe(
        (value) => value,
        () => {
          notifications += 1;
        },
      );
      expect(notifications).toBe(1);

      expect(() => Reflect.apply(appStore.setState, appStore, [state])).toThrow(ZodError);

      expect(appStore.getState()).toBe(initial);
      expect(notifications).toBe(1);
    });
  });

  describe("search integration", () => {
    test("notifies with complete search selections, ignores unrelated slices, and unsubscribes", () => {
      const first = new AppStore();
      const second = new AppStore();
      expect(first.search.getState()).toEqual({
        query: "",
        category: "TRACKING_NUMBER",
        dirty: false,
      });
      first.search.setState({ ...first.search.getState(), dirty: true });
      const initial = first.getState();
      type Selection = AppState["search"];
      const updates: Array<{ value: Selection; previousValue: Selection }> = [];
      const unsubscribe = first.subscribe(
        (state) => state.search,
        (value, previousValue) => updates.push({ value, previousValue }),
      );
      first.metrics.setActiveMetric("EXCEPTION");
      expect(updates).toEqual([
        {
          value: { query: "", category: "TRACKING_NUMBER", dirty: true },
          previousValue: {
            query: "",
            category: "TRACKING_NUMBER",
            dirty: true,
          },
        },
      ]);

      first.search.setSearchTerm({
        query: "  Chicago  ",
        category: "DESTINATION_CITY",
      });
      unsubscribe();
      first.search.setSearchTerm({ query: "", category: "DESTINATION_CITY" });

      expect(updates).toEqual([
        {
          value: { query: "", category: "TRACKING_NUMBER", dirty: true },
          previousValue: {
            query: "",
            category: "TRACKING_NUMBER",
            dirty: true,
          },
        },
        {
          value: {
            query: "  Chicago  ",
            category: "DESTINATION_CITY",
            dirty: true,
          },
          previousValue: {
            query: "",
            category: "TRACKING_NUMBER",
            dirty: true,
          },
        },
      ]);
      expect(initial.search).toEqual({
        query: "",
        category: "TRACKING_NUMBER",
        dirty: true,
      });
      expect(second.search.getState()).toEqual({
        query: "",
        category: "TRACKING_NUMBER",
        dirty: false,
      });
    });

    test("restores search with other slices atomically and keeps the search store connected", () => {
      const appStore = new AppStore();
      const search = appStore.search;
      const input = SearchStateSchema.parse({
        query: "REF-123",
        category: "SHIPPER_REFERENCE",
        dirty: true,
      });
      const updates: Array<[string, string]> = [];
      appStore.subscribe(
        (state) => state,
        (state) => updates.push([state.search.query, state.views.activeView]),
      );

      appStore.setState({
        ...appStore.getState(),
        search: input,
        views: { activeView: "saved-search", dirty: true },
      });
      input.query = "Caller mutation";

      expect(appStore.search).toBe(search);
      expect(search.getState()).toEqual({
        query: "REF-123",
        category: "SHIPPER_REFERENCE",
        dirty: true,
      });
      expect(updates).toEqual([
        ["", "default"],
        ["REF-123", "saved-search"],
      ]);

      search.setSearchTerm({ query: "REF-456", category: "SHIPPER_REFERENCE" });

      expect(appStore.getState().search).toEqual({
        query: "REF-456",
        category: "SHIPPER_REFERENCE",
        dirty: true,
      });
      expect(updates).toEqual([
        ["", "default"],
        ["REF-123", "saved-search"],
        ["REF-456", "saved-search"],
      ]);
    });

    test("notifies snapshot selectors but not primitive selectors for equal search replacements", () => {
      const appStore = new AppStore();
      const initial = appStore.search.getState();
      const snapshots: AppState["search"][] = [];
      const queries: string[] = [];
      appStore.subscribe(
        (state) => state.search,
        (value) => snapshots.push(value),
      );
      appStore.subscribe(
        (state) => state.search.query,
        (value) => queries.push(value),
      );

      appStore.search.setSearchTerm({ query: "", category: "TRACKING_NUMBER" });

      expect(snapshots).toEqual([
        { query: "", category: "TRACKING_NUMBER", dirty: false },
        { query: "", category: "TRACKING_NUMBER", dirty: false },
      ]);
      expect(snapshots[0]).toBe(initial);
      expect(snapshots[1]).not.toBe(initial);
      expect(queries).toEqual([""]);
    });
  });

  describe("initialization and state integration", () => {
    test("integrates views with subscriptions, snapshots, and isolated instances", () => {
      const first = new AppStore();
      const second = new AppStore();
      const views = first.views;
      const initial = first.getState();
      const updates: string[] = [];
      const unsubscribe = first.subscribe(
        (state) => state.views.activeView,
        (value) => updates.push(value),
      );

      views.setActiveView("view-1");
      first.metrics.setActiveMetric("EXCEPTION");
      unsubscribe();
      views.setActiveView("default");

      expect(updates).toEqual(["default", "view-1"]);
      expect(initial.views).toEqual(initialAppState.views);
      expect(second.views.getState()).toEqual(initialAppState.views);
      expect(first.views.getState()).toBe(first.getState().views);

      first.setState(JSON.parse(JSON.stringify(first.getState())));
      expect(first.views).toBe(views);
      expect(first.views.getState()).toEqual({
        activeView: "default",
        dirty: false,
      });
      views.setActiveView("view-1");
      expect(first.getState().views.activeView).toBe("view-1");
    });

    test("restores snapshots with only an active view identifier and dirty flag", () => {
      const appStore = new AppStore();
      const initial = appStore.getState();

      appStore.setState({
        ...initial,
        views: { activeView: "view-1", dirty: true },
      });

      expect(appStore.views.getState()).toEqual({
        activeView: "view-1",
        dirty: true,
      });
      expect(initial).toEqual(initialAppState);
    });

    test("starts with the configured initial application state", () => {
      const appStore = new AppStore();

      expect(appStore.getState()).toEqual(initialAppState);
      expect(appStore.account.getState()).toBe(appStore.getState().account);
      expect(appStore.account.getActiveAccounts()).toEqual([]);
      expect(appStore.metrics.getState()).toBe(appStore.getState().metrics);
      expect(appStore.columns.getState()).toBe(appStore.getState().columns);
      expect(appStore.statuses.getState()).toBe(appStore.getState().statuses);
      expect(appStore.statuses.getActiveStatuses()).toEqual([]);
      expect(appStore.statuses.getState().dirty).toBe(false);
    });

    test("notifies active-accounts subscribers only for accounts selections and supports unsubscribe", () => {
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

      appStore.account.setActiveAccounts(["accounts-1", "accounts-2"]);
      appStore.metrics.setActiveMetric("EXCEPTION");
      appStore.account.setActiveAccounts([]);
      unsubscribe();
      appStore.account.setActiveAccounts(["accounts-3"]);

      expect(updates).toEqual([[], ["accounts-1", "accounts-2"], []]);
      expect(previous).toEqual([[], [], ["accounts-1", "accounts-2"]]);
    });

    test("exposes a stable statuses store connected to application state without changing other slices or snapshots", () => {
      const appStore = new AppStore();
      const statuses = appStore.statuses;
      const initial = appStore.getState();

      statuses.setActiveStatuses(["LABEL_CREATED", "EXCEPTION:DAMAGED_PACKAGE"]);

      expect(appStore.statuses).toBe(statuses);
      expect(statuses.getState()).toBe(appStore.getState().statuses);
      expect(appStore.getState().statuses.activeStatuses).toEqual([
        "LABEL_CREATED",
        "EXCEPTION:DAMAGED_PACKAGE",
      ]);
      expect(initial.statuses.activeStatuses).toEqual([]);
      expect(appStore.getState().metrics).toBe(initial.metrics);
      expect(appStore.getState().columns).toBe(initial.columns);
    });

    test("keeps status updates isolated between application-state instances", () => {
      const first = new AppStore();
      const second = new AppStore();
      const secondInitial = second.getState();

      first.statuses.setActiveStatuses(["DELIVERED"]);

      expect(first.getState().statuses.activeStatuses).toEqual(["DELIVERED"]);
      expect(second.getState()).toBe(secondInitial);
      expect(second.statuses.getActiveStatuses()).toEqual([]);
    });

    test("exposes a stable metrics state connected to the application state", () => {
      const appStore = new AppStore();
      const metrics = appStore.metrics;
      const initial = appStore.getState();

      metrics.setActiveMetric("EXCEPTION");

      expect(appStore.metrics).toBe(metrics);
      expect(appStore.getState().metrics.activeMetric).toBe("EXCEPTION");
      expect(metrics.getState()).toBe(appStore.getState().metrics);
      expect(appStore.getState()).not.toBe(initial);
    });

    test("keeps updates isolated between application-state instances", () => {
      const first = new AppStore();
      const second = new AppStore();
      const secondInitial = second.getState();

      first.metrics.setActiveMetric("EXCEPTION");

      expect(second.getState()).toBe(secondInitial);
      expect(second.getState()).toEqual(initialAppState);
      expect(first.getState()).not.toBe(second.getState());
    });

    test("exposes a stable columns state connected to the application state", () => {
      const appStore = new AppStore();
      const columns = appStore.columns;
      const initial = appStore.getState();

      columns.setActiveColumns([
        { name: "STATUS", sortDirection: "desc" },
        { name: "TRACKING_ID" },
      ]);

      expect(appStore.columns).toBe(columns);
      expect(appStore.getState().columns.activeColumns).toEqual([
        { name: "STATUS", sortDirection: "desc" },
        { name: "TRACKING_ID" },
      ]);
      expect(columns.getState()).toBe(appStore.getState().columns);
      expect(appStore.getState()).not.toBe(initial);
      expect(appStore.getState().metrics).toBe(initial.metrics);
      expect(initial.columns.activeColumns).toEqual([
        { name: "TRACKING_ID" },
        { name: "STATUS" },
        { name: "EST_DELIVERY" },
      ]);
    });

    test("keeps columns updates isolated between application-state instances", () => {
      const first = new AppStore();
      const second = new AppStore();
      const secondInitial = second.getState();

      first.columns.setActiveColumns([{ name: "TRACKING_ID" }]);

      expect(first.getState().columns.activeColumns).toEqual([{ name: "TRACKING_ID" }]);
      expect(second.getState()).toBe(secondInitial);
      expect(second.getState()).toEqual(initialAppState);
      expect(first.getState().columns).not.toBe(second.getState().columns);
    });
  });

  describe("subscriptions", () => {
    test("initializes a late single-selector subscriber synchronously with the latest value", () => {
      const appStore = new AppStore();
      appStore.account.setActiveAccounts(["earlier"]);
      appStore.account.setActiveAccounts(["latest"]);
      const updates: Array<{ value: string[]; previousValue: string[] }> = [];

      const unsubscribe = appStore.subscribe(
        (state) => state.account.activeAccounts,
        (value, previousValue) => updates.push({ value, previousValue }),
      );

      expect(updates).toEqual([{ value: ["latest"], previousValue: ["latest"] }]);
      expect(updates[0]?.value).toBe(appStore.account.getActiveAccounts());
      expect(updates[0]?.previousValue).toBe(updates[0]?.value);
      appStore.views.setActiveView("unrelated");
      expect(updates).toHaveLength(1);

      appStore.account.setActiveAccounts(["next"]);
      unsubscribe();
      appStore.account.setActiveAccounts(["ignored"]);

      expect(updates).toEqual([
        { value: ["latest"], previousValue: ["latest"] },
        { value: ["next"], previousValue: ["latest"] },
      ]);
    });

    test("infers single-selector current and previous values", () => {
      const appStore = new AppStore();
      const unsubscribe = appStore.subscribe(
        (state) => state.columns,
        (value, previousValue) => {
          expectTypeOf(value).toEqualTypeOf<AppState["columns"]>();
          expectTypeOf(previousValue).toEqualTypeOf<AppState["columns"]>();
        },
      );
      expectTypeOf(unsubscribe).toEqualTypeOf<() => void>();
      unsubscribe();

      const invalidCalls = () => {
        // @ts-expect-error Subscriptions accept one selector function, not a selector array.
        appStore.subscribe([(state: AppState) => state.columns], () => {});
        appStore.subscribe<AppState["columns"]>(
          (state) => state.columns,
          // @ts-expect-error The listener must match the selected value type.
          (_value: string) => {},
        );
      };
      void invalidCalls;
    });

    test("treats newly allocated selector results as changes", () => {
      const appStore = new AppStore();
      const updates: Array<{
        value: { accounts: string[] };
        previousValue: { accounts: string[] };
      }> = [];
      appStore.subscribe(
        (state) => ({ accounts: state.account.activeAccounts }),
        (value, previousValue) => updates.push({ value, previousValue }),
      );

      appStore.metrics.setActiveMetric("EXCEPTION");

      expect(updates).toEqual([
        { value: { accounts: [] }, previousValue: { accounts: [] } },
        { value: { accounts: [] }, previousValue: { accounts: [] } },
      ]);
      expect(updates[1]?.value).not.toBe(updates[1]?.previousValue);
      expect(updates[1]?.value.accounts).toBe(updates[1]?.previousValue.accounts);
    });

    test("notifies for equal selected data with distinct references", () => {
      const appStore = new AppStore();
      const initial = appStore.getState();
      const updates: Array<{ value: string[]; previousValue: string[] }> = [];
      appStore.subscribe(
        (state) => state.account.activeAccounts,
        (value, previousValue) => updates.push({ value, previousValue }),
      );

      appStore.setState(JSON.parse(JSON.stringify(initial)));

      expect(updates).toEqual([
        { value: [], previousValue: [] },
        { value: [], previousValue: [] },
      ]);
      expect(updates[1]?.value).toBe(appStore.account.getActiveAccounts());
      expect(updates[1]?.previousValue).toBe(initial.account.activeAccounts);
      expect(updates[1]?.value).not.toBe(updates[1]?.previousValue);
    });

    test("observes filter replacements until unsubscribed and ignores other slices", () => {
      const first = new AppStore();
      const second = new AppStore();
      const initial = first.getState();
      const filters = first.filters;
      const updates: Array<{
        value: AppState["filters"]["activeFilters"];
        previousValue: AppState["filters"]["activeFilters"];
      }> = [];
      const unsubscribe = first.subscribe(
        (state) => state.filters.activeFilters,
        (value, previousValue) => updates.push({ value, previousValue }),
      );

      filters.setActiveFilters([
        {
          type: "SHIPMENT:DELIVERY_PREDICTION",
          criteria: "ON_TIME",
        },
      ]);
      filters.setActiveFilters([
        {
          type: "SHIPMENT:DELIVERY_PREDICTION",
          criteria: "ON_TIME",
        },
      ]);
      first.metrics.setActiveMetric("EXCEPTION");
      filters.setActiveFilters([]);
      unsubscribe();
      filters.setActiveFilters([
        {
          type: "SHIPMENT:SIGNATURE_AVAILABLE",
          criteria: true,
        },
      ]);

      expect(updates).toEqual([
        { value: [], previousValue: [] },
        {
          value: [{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" }],
          previousValue: [],
        },
        {
          value: [{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" }],
          previousValue: [{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" }],
        },
        {
          value: [],
          previousValue: [{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" }],
        },
      ]);
      expect(first.filters).toBe(filters);
      expect(initial.filters).toEqual({ activeFilters: [], dirty: false });
      expect(second.filters.getState()).toBe(second.getState().filters);
      expect(second.filters.getState()).toEqual({
        activeFilters: [],
        dirty: false,
      });
    });

    test("emits new and previous status selections only for status updates until unsubscribed", () => {
      const appStore = new AppStore();
      const updates: Array<{
        value: AppState["statuses"]["activeStatuses"];
        previousValue: AppState["statuses"]["activeStatuses"];
      }> = [];
      const unsubscribe = appStore.subscribe(
        (state) => state.statuses.activeStatuses,
        (value, previousValue) => updates.push({ value, previousValue }),
      );

      expect(updates).toEqual([{ value: [], previousValue: [] }]);
      appStore.statuses.setActiveStatuses(["LABEL_CREATED"]);
      appStore.metrics.setActiveMetric("EXCEPTION");
      appStore.columns.setActiveColumns([{ name: "TRACKING_ID" }]);
      appStore.statuses.setActiveStatuses([]);
      unsubscribe();
      appStore.statuses.setActiveStatuses(["DELIVERED"]);

      expect(updates).toEqual([
        { value: [], previousValue: [] },
        { value: ["LABEL_CREATED"], previousValue: [] },
        { value: [], previousValue: ["LABEL_CREATED"] },
      ]);
    });

    test("emits new and previous columns only for columns updates until unsubscribed", () => {
      const appStore = new AppStore();
      const initial = appStore.columns.getActiveColumns();
      const updates: Array<{
        value: AppState["columns"]["activeColumns"];
        previousValue: AppState["columns"]["activeColumns"];
      }> = [];
      const unsubscribe = appStore.subscribe(
        (state) => state.columns.activeColumns,
        (value, previousValue) => updates.push({ value, previousValue }),
      );

      expect(updates).toEqual([{ value: initial, previousValue: initial }]);

      appStore.columns.setActiveColumns([{ name: "TRACKING_ID" }]);
      appStore.metrics.setActiveMetric("EXCEPTION");
      appStore.columns.setActiveColumns([
        { name: "STATUS", sortDirection: "asc" },
        { name: "TRACKING_ID" },
      ]);
      unsubscribe();
      appStore.columns.setActiveColumns([{ name: "TRACKING_ID" }]);

      expect(updates).toEqual([
        { value: initial, previousValue: initial },
        {
          value: [{ name: "TRACKING_ID" }],
          previousValue: [{ name: "TRACKING_ID" }, { name: "STATUS" }, { name: "EST_DELIVERY" }],
        },
        {
          value: [{ name: "STATUS", sortDirection: "asc" }, { name: "TRACKING_ID" }],
          previousValue: [{ name: "TRACKING_ID" }],
        },
      ]);
    });

    test("emits the initial metric and then new and previous values when it changes", () => {
      const appStore = new AppStore();
      const updates: Array<{
        value: AppState["metrics"]["activeMetric"];
        previousValue: AppState["metrics"]["activeMetric"];
      }> = [];
      appStore.subscribe(
        (state) => state.metrics.activeMetric,
        (value, previousValue) => updates.push({ value, previousValue }),
      );

      expect(updates).toEqual([{ value: null, previousValue: null }]);

      appStore.metrics.setActiveMetric("EXCEPTION");
      appStore.metrics.setSelectedMetrics(["EXCEPTION"]);
      appStore.metrics.setActiveMetric("LABEL_CREATED");

      expect(updates).toEqual([
        { value: null, previousValue: null },
        {
          value: "EXCEPTION",
          previousValue: initialAppState.metrics.activeMetric,
        },
        {
          value: "LABEL_CREATED",
          previousValue: "EXCEPTION",
        },
      ]);
    });

    test("supports selecting and observing the entire application state", () => {
      const appStore = new AppStore();
      const initial = appStore.getState();
      const updates: Array<{ value: AppState; previousValue: AppState }> = [];
      appStore.subscribe(
        (state) => state,
        (value, previousValue) => updates.push({ value, previousValue }),
      );

      appStore.metrics.setSelectedMetrics(["EXCEPTION"]);

      expect(updates).toHaveLength(2);
      expect(updates[0]).toEqual({ value: initial, previousValue: initial });
      expect(updates[1]?.value).toBe(appStore.getState());
      expect(updates[1]?.previousValue).toBe(initial);
    });

    test("unsubscribes a listener without disconnecting other listeners", () => {
      const appStore = new AppStore();
      const unsubscribedUpdates: Array<AppState["metrics"]["selectedMetrics"]> = [];
      const activeUpdates: Array<AppState["metrics"]["selectedMetrics"]> = [];
      const unsubscribe = appStore.subscribe(
        (state) => state.metrics.selectedMetrics,
        (value) => unsubscribedUpdates.push(value),
      );
      appStore.subscribe(
        (state) => state.metrics.selectedMetrics,
        (value) => activeUpdates.push(value),
      );

      appStore.metrics.setSelectedMetrics(["EXCEPTION"]);
      unsubscribe();
      appStore.metrics.setSelectedMetrics(["LABEL_CREATED"]);

      expect(unsubscribedUpdates).toEqual([[], ["EXCEPTION"]]);
      expect(activeUpdates).toEqual([[], ["EXCEPTION"], ["LABEL_CREATED"]]);
    });
  });
});
