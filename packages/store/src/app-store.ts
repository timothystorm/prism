import { subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { AccountsStore } from "./accounts/accounts-store";
import { type AppState, AppStateSchema, initialAppState } from "./app-state";
import { ColumnsStore } from "./columns/columns-store";
import { FilterStore } from "./filters/filter-store";
import { MetricsStore } from "./metrics/metrics-store";
import { SearchStore } from "./search/search-store";
import { StatusesStore } from "./statuses/statuses-store";
import { TrackIdsStore } from "./track-ids/track-ids-store";
import { ViewsStore } from "./views/views-store";

/**
 * Owns one application's selection state and exposes stable, validated slice stores.
 * Create one instance per application scope and share it with the controllers and clients
 * that should observe the same state. Separate instances do not share updates.
 *
 * Navigate to a slice through stable properties such as `account`, `columns`, or `filters`.
 * Read stored values through getX() methods and update them through setX() or action methods.
 * Each slice also exposes getState()/setState() for reading or replacing its entire state.
 * Use a slice's setState() when several fields in that slice must change together.
 * Use appStore.getState()/setState() to read or atomically replace the entire application state.
 * Returned objects and arrays are store-owned snapshots: do not mutate them directly. Slice updates preserve
 * earlier snapshots and unchanged slice references.
 *
 * This class manages state, not business workflows, persistence, or loading data.
 * Controllers coordinate those responsibilities and decide when dirty flags change.
 * Domain setX()/action methods preserve existing dirty flags; explicit state replacement uses
 * the supplied flags. Invalid writes throw ZodError before changing state.
 *
 * Use {@link AppStore.subscribe | subscribe} to observe selected values and release each
 * subscription when its client is disposed. Subscribers receive raw AppState fields,
 * not slice-store instances: selectors still read fields such as `state.account.activeAccounts`.
 *
 * @example Create and share an application store
 * ```typescript
 * import { AppStore } from "@fedex/prism-store";
 *
 * const appStore = new AppStore();
 * appStore.account.setActiveAccounts(["account-1"]);
 * appStore.filters.setActiveFilters([
 *   { type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "DELAYED" },
 * ]);
 * const accounts = appStore.account.getActiveAccounts();
 * ```
 *
 * @example Replace a slice and explicitly manage its dirty flag
 * ```typescript
 * appStore.account.setState({
 *   ...appStore.account.getState(),
 *   activeAccounts: ["account-2"],
 *   dirty: true,
 * });
 * ```
 */
export class AppStore {
  private readonly _account: AccountsStore;
  private readonly _metrics: MetricsStore;
  private readonly _columns: ColumnsStore;
  private readonly _statuses: StatusesStore;
  private readonly _filters: FilterStore;
  private readonly _views: ViewsStore;
  private readonly _search: SearchStore;
  private readonly _trackIds: TrackIdsStore;
  private readonly _store = createStore<AppState>()(subscribeWithSelector(() => initialAppState));

  /**
   * Creates an application store with the configured initial state and no subscriptions.
   * Slice-store instances remain connected even when the entire application state is replaced.
   */
  constructor() {
    this._account = new AccountsStore(this._store.getState, this._store.setState);
    this._metrics = new MetricsStore(this._store.getState, this._store.setState);
    this._columns = new ColumnsStore(this._store.getState, this._store.setState);
    this._statuses = new StatusesStore(this._store.getState, this._store.setState);
    this._filters = new FilterStore(this._store.getState, this._store.setState);
    this._views = new ViewsStore(this._store.getState, this._store.setState);
    this._search = new SearchStore(this._store.getState, this._store.setState);
    this._trackIds = new TrackIdsStore(this._store.getState, this._store.setState);
  }

  /**
   * Returns the current full-state snapshot for controllers, clients, and serialization.
   * This is a store-owned reference, not a defensive copy. Do not modify it or its nested values.
   * Construct a new snapshot with object/array copies before passing it to setState().
   * Use slice getX() methods when only one selection is needed.
   *
   * @example Capture a JSON snapshot
   * ```typescript
   * const snapshotJson = JSON.stringify(appStore.getState());
   * ```
   *
   * @return The current application state.
   */
  getState(): AppState {
    return this._store.getState();
  }

  /**
   * Validates and atomically replaces the entire application state in a single store update.
   * Use this for controller commands that coordinate several slices, such as applying a view.
   * Supply every required slice; this does not merge a partial state into the current state.
   * All validation completes before committing. Invalid input leaves every slice unchanged
   * and does not notify subscribers. Subscribers never observe intermediate slice states.
   * Slice-store instances and existing subscriptions remain connected after replacement.
   *
   * Schema parsing detaches the input data and applies schemas defaults. Dirty flags are
   * taken from the supplied state, not recalculated. Missing active metrics normalize to null.
   * Every slice is parsed, so object/array selectors can notify even for slices with equal data.
   * Each matching subscription is called once for this update; separate setter calls are not batched.
   *
   * @example Apply filters and an active view together
   * ```typescript
   * appStore.setState({
   *   ...appStore.getState(),
   *   filters: {
   *     activeFilters: [
   *       { type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "DELAYED" },
   *     ],
   *     dirty: true,
   *   },
   *   views: { activeView: "delayed", dirty: true },
   * });
   * ```
   *
   * @example Restore a serialized snapshot
   * ```typescript
   * appStore.setState(JSON.parse(snapshotJson));
   * ```
   *
   * @param state The complete application state to set.
   * @throws ZodError If the state is invalid. The state remains unchanged.
   */
  setState(state: AppState): void {
    const validated = AppStateSchema.parse(state);
    this._store.setState(validated, true);
  }

  /**
   * Provides the active metric and ordered metrics selected for display in the current view.
   * The active metric is independent of the display selection.
   * Use getActiveMetric()/getSelectedMetrics() to read and the corresponding setX() methods
   * to replace selections; do not push into the returned arrays.
   * Metric updates preserve dirty; controllers can toggle it through setState().
   *
   * @example
   * ```typescript
   * appStore.metrics.setActiveMetric("EXCEPTION");
   * appStore.metrics.setSelectedMetrics(["EXCEPTION", "IN_TRANSIT"]);
   * const selected = appStore.metrics.getSelectedMetrics();
   * ```
   *
   * @return The metrics store.
   */
  get metrics(): MetricsStore {
    return this._metrics;
  }

  /**
   * Provides the active tracking identifiers for the current view.
   * Use getTrackIds() to read and setActiveTrackIds() to replace the selection.
   * TrackId updates preserve dirty; controllers can toggle it through setState().
   *
   * @example
   * ```typescript
   * appStore.trackIds.setActiveTrackIds(["TRACK-123", "TRACK-456"]);
   * const trackIds = appStore.trackIds.getActiveTrackIds();
   * ```
   *
   * @return The track IDs store.
   */
  get trackIds(): TrackIdsStore {
    return this._trackIds;
  }

  /**
   * Provides columns in display order, including optional sort directions.
   * Read with getActiveColumns(). Use setActiveColumns() to replace the selection
   * with unique column names and retain the required TRACKING_ID column.
   * Column updates preserve dirty; controllers can toggle it through setState().
   *
   * @example
   * ```typescript
   * appStore.columns.setActiveColumns([
   *   { name: "TRACKING_ID" },
   *   { name: "STATUS", sortDirection: "asc" },
   * ]);
   * ```
   *
   * @return The columns store.
   */
  get columns(): ColumnsStore {
    return this._columns;
  }

  /**
   * Provides parent and child status selections as independent OR terms.
   * Read with getActiveStatuses(). Pass an empty array to setActiveStatuses() to clear
   * them, or use addActiveStatuses() to append one status without duplicates.
   * These updates preserve the slice's dirty flag.
   *
   * @example
   * ```typescript
   * appStore.statuses.setActiveStatuses(["EXCEPTION:DAMAGED_PACKAGE"]);
   * appStore.statuses.addActiveStatuses("IN_TRANSIT");
   * ```
   *
   * @return The statuses store.
   */
  get statuses(): StatusesStore {
    return this._statuses;
  }

  /**
   * Provides the active account identifiers, not the full list of accessible accounts.
   * Read with getActiveAccounts(). Pass unique, non-empty identifiers to setActiveAccounts();
   * an empty array clears the selection.
   * Selection updates preserve the slice's dirty flag.
   *
   * @example
   * ```typescript
   * appStore.account.setActiveAccounts(["account-1", "account-2"]);
   * appStore.account.setActiveAccounts([]);
   * ```
   *
   * @return The store of accounts identifiers currently in focus.
   */
  get account(): AccountsStore {
    return this._account;
  }

  /**
   * Provides active discriminated-union filters, with at most one entry per filter type.
   * Read selections with getActiveFilters(). Use setActiveFilters() to replace the ordered
   * list; an empty array clears it. Equal-content replacements still have new references
   * and notify subscribers selecting the list. Use setState() to replace the full slice.
   * Filter-list updates preserve the slice's dirty flag. Date criteria remain YYYY-MM-DD
   * calendar-date strings; the store does not add times or timezones.
   *
   * @example
   * ```typescript
   * appStore.filters.setActiveFilters([
   *   { type: "SHIPMENT:SIGNATURE_AVAILABLE", criteria: true },
   * ]);
   * const filters = appStore.filters.getActiveFilters();
   * appStore.filters.setActiveFilters([]);
   * ```
   *
   * @return The store of filters currently in focus.
   */
  get filters(): FilterStore {
    return this._filters;
  }

  /**
   * Shares the active view identifier with other clients through getActiveView()/setActiveView().
   * View lists, names, and component configuration are not stored here. Changing the identifier
   * does not apply filters or other selections; controllers coordinate applying a view.
   * Active-view updates preserve the slice's dirty flag.
   *
   * @example
   * ```typescript
   * appStore.views.setActiveView("delayed");
   * const activeView = appStore.views.getActiveView();
   * ```
   *
   * @return The store of the active view identifier.
   */
  get views(): ViewsStore {
    return this._views;
  }

  /**
   * Provides the current search query and its interpretation category.
   * Use getSearchTerm()/setSearchTerm() to read or replace both fields together.
   * An empty query clears the search within the supplied category; text is stored verbatim.
   * Search updates preserve dirty. Controllers use setState() to change the flag and
   * own normalization, executing searches, and interpreting an empty query.
   *
   * Each replacement stores a new search snapshot, even for equal selections.
   * Snapshot selectors can therefore notify when query/category primitive selectors do not.
   *
   * @example
   * ```typescript
   * appStore.search.setSearchTerm({
   *   query: "REF-123",
   *   category: "SHIPPER_REFERENCE",
   * });
   * const search = appStore.search.getSearchTerm();
   * appStore.search.setState({
   *   ...appStore.search.getState(),
   *   dirty: true,
   * });
   * ```
   *
   * @return The search-selection store.
   */
  get search(): SearchStore {
    return this._search;
  }

  /**
   * Subscribes to one selected value, comparing results with Object.is.
   * Immediately calls the listener synchronously with the current selection as both
   * current and previous values, including for late subscribers. Past changes are not replayed.
   * Subsequent calls receive new and previous values only when the selection changes.
   * Selectors should be pure; allocating a new result object counts as a change.
   * Prefer selecting an existing field, slice, or primitive.
   * Selectors receive raw AppState data, so they read properties rather than call slice methods.
   *
   * Notifications are synchronous. Separate setter/action calls are separate updates,
   * not a batch; use appStore.setState() for an atomic multi-slice update.
   * The initial callback runs before the unsubscribe function is returned.
   * Release the subscription when the subscribing client is disposed.
   *
   * @example
   * ```typescript
   * const unsubscribe = appStore.subscribe(
   *   (state) => state.metrics.activeMetric,
   *   (newValue, previousValue) => {
   *     console.log('Active metric changed from', previousValue, 'to', newValue);
   *   }
   * );
   *
   * appStore.metrics.setActiveMetric("EXCEPTION");
   * unsubscribe();
   * ```
   *
   * @param selector A function that selects a part of the application state to listen to.
   * @param listener Receives the current selection immediately, then new and previous values whenever it changes.
   * @return A function that unsubscribes this listener.
   */
  subscribe<T>(
    selector: (state: AppState) => T,
    listener: (value: T, previousValue: T) => void,
  ): () => void {
    // Keep Object.is comparison and deliver the current selection to late subscribers.
    return this._store.subscribe(selector, listener, {
      fireImmediately: true,
    });
  }
}
