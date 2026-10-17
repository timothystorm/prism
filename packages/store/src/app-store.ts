import { subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { type AppState, AppStateSchema, initialAppState } from "./app-state";
import { ColumnsStore } from "./columns/columns-store";
import { MetricsStore } from "./metrics/metrics-store";
import { StatusesStore } from "./statuses/statuses-store";

/**
 * A state that holds the application state and provides methods to access and update it.
 */
export class AppStore {
	private readonly _metrics: MetricsStore;
	private readonly _columns: ColumnsStore;
	private readonly _statuses: StatusesStore;
	private readonly _store = createStore<AppState>()(
		subscribeWithSelector(() => initialAppState),
	);

	constructor() {
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
	 * Subscribes to changes in the application state based on a selector function. The listener will be called whenever
	 * the selected value changes.
	 *
	 * @example
	 * ```typescript
	 * const unsubscribe = appStore.subscribe(
	 *   (state) => state.metrics.focusedMetric,
	 *   (newValue, previousValue) => {
	 *     console.log('Focused metric changed from', previousValue, 'to', newValue);
	 *   }
	 * );
	 *
	 * @param selector A function that selects a part of the application state to listen to.
	 * @param listener A function that will be called with the new and previous values of the selected state whenever it changes.
	 */
	subscribe<T>(
		selector: (state: AppState) => T,
		listener: (value: T, previousValue: T) => void,
	): () => void {
		return this._store.subscribe(selector, listener);
	}
}
