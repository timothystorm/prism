import { subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { shallow } from "zustand/vanilla/shallow";
import { AccountsStore } from "./accounts/accounts-store";
import { type AppState, AppStateSchema, initialAppState } from "./app-state";
import { ColumnsStore } from "./columns/columns-store";
import { FilterStore } from "./filters/filter-store";
import { MetricsStore } from "./metrics/metrics-store";
import { StatusesStore } from "./statuses/statuses-store";
import { ViewsStore } from "./views/views-store";

/**
 * A state that holds the application state and provides methods to access and update that state.
 */
export class AppStore {
	private readonly _account: AccountsStore;
	private readonly _metrics: MetricsStore;
	private readonly _columns: ColumnsStore;
	private readonly _statuses: StatusesStore;
	private readonly _filters: FilterStore;
	private readonly _views: ViewsStore;
	private readonly _store = createStore<AppState>()(
		subscribeWithSelector(() => initialAppState),
	);

	constructor() {
		this._account = new AccountsStore(
			this._store.getState,
			this._store.setState,
		);
		this._metrics = new MetricsStore(
			this._store.getState,
			this._store.setState,
		);

		this._columns = new ColumnsStore(
			this._store.getState,
			this._store.setState,
		);

		this._statuses = new StatusesStore(
			this._store.getState,
			this._store.setState,
		);

		this._filters = new FilterStore(this._store.getState, this._store.setState);
		this._views = new ViewsStore(this._store.getState, this._store.setState);
	}

	/**
	 * Gets the current application state. Use this method to retrieve the entire state of the application.  This is
	 * intended for internal use and should be used with caution, as it exposes the entire state of the application.
	 *
	 * @return The current application state.
	 * @internal
	 */
	get _state(): AppState {
		return this._store.getState();
	}

	/**
	 * Replaces the entire application state in a single update. Intended for internal tools such as automated tests
	 * and AI agents. Use the individual stores for normal application updates.
	 *
	 * @param state The complete application state to set.
	 * @throws ZodError If the state is invalid. The state remains unchanged.
	 * @internal
	 */
	set _state(state: AppState) {
		const validated = AppStateSchema.parse(state);
		this._store.setState(validated, true);
	}

	/**
	 * Gets the metrics store, which provides methods to manipulate the metrics state in the application.
	 *
	 * @return The metrics store.
	 */
	get metrics(): MetricsStore {
		return this._metrics;
	}

	/**
	 * Gets the columns store, which provides methods to manipulate the columns state in the application.
	 *
	 * @return The columns store.
	 */
	get columns(): ColumnsStore {
		return this._columns;
	}

	/**
	 * Gets the statuses store, which provides methods to manipulate the statuses state in the application.
	 *
	 * @return The statuses store.
	 */
	get statuses(): StatusesStore {
		return this._statuses;
	}

	/**
	 * @return The store of accounts identifiers currently in focus.
	 */
	get account(): AccountsStore {
		return this._account;
	}

	/**
	 * @return The store of filters currently in focus.
	 */
	get filters(): FilterStore {
		return this._filters;
	}

	/**
	 * @return The store of custom view metadata and the current view identifier.
	 */
	get views(): ViewsStore {
		return this._views;
	}

	/**
	 * Subscribes to one selected value, comparing results with Object.is.
	 * The listener receives current and previous values only after a change, not on registration.
	 * Selectors should be pure; allocating a new result object counts as a change.
	 *
	 * @example
	 * ```typescript
	 * const unsubscribe = appStore.subscribe(
	 *   (state) => state.metrics.focusedMetric,
	 *   (newValue, previousValue) => {
	 *     console.log('Focused metric changed from', previousValue, 'to', newValue);
	 *   }
	 * );
	 * ```
	 *
	 * @param selector A function that selects a part of the application state to listen to.
	 * @param listener A function that will be called with the new and previous values of the selected state whenever it changes.
	 * @return A function that unsubscribes this listener.
	 */
	subscribe<T>(
		selector: (state: AppState) => T,
		listener: (value: T, previousValue: T) => void,
	): () => void;

	/**
	 * Subscribes to a non-empty tuple of selectors with positionally inferred results.
	 * Compares each selected result with Object.is, not deep equality. The listener receives
	 * complete current and previous tuples once per store update when any result changes.
	 * Does not notify on registration or batch separate updates.
	 *
	 * Selectors should be pure; allocating a new result object counts as a change.
	 * Inline selector arrays infer tuples automatically. Preserve named arrays as tuples,
	 * for example with `as const`. The selector list is copied on registration.
	 *
	 * @example
	 * ```typescript
	 * const unsubscribe = appStore.subscribe(
	 *   [
	 *     (state) => state.columns,
	 *     (state) => state.filters.active,
	 *     (state) => state.account,
	 *   ],
	 *   ([columns, filters, account], [previousColumns, previousFilters, previousAccount]) => {
	 *     console.log(columns, filters, account);
	 *     console.log(previousColumns, previousFilters, previousAccount);
	 *   },
	 * );
	 * ```
	 *
	 * @param selectors One or more selector functions, in listener tuple order.
	 * @param listener Receives the current and previous selected tuples.
	 * @return A function that unsubscribes this listener.
	 * @throws TypeError If an empty selector list bypasses static typing.
	 */
	subscribe<Values extends [unknown, ...unknown[]]>(
		selectors: readonly [
			...{ [K in keyof Values]: (state: AppState) => Values[K] },
		],
		listener: (value: Values, previousValue: Values) => void,
	): () => void;
	subscribe<T>(
		selector:
			| ((state: AppState) => T)
			| readonly ((state: AppState) => unknown)[],
		listener: (value: T, previousValue: T) => void,
	): () => void {
		if (typeof selector === "function") {
			return this._store.subscribe(selector, listener);
		}
		if (selector.length === 0) {
			throw new TypeError("At least one selector is required");
		}
		const selectors = [...selector];
		return this._store.subscribe(
			// Mapping preserves the tuple order and result types declared by the overload.
			(state) => selectors.map((select) => select(state)) as T,
			listener,
			{ equalityFn: shallow },
		);
	}
}
