import { subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "./app-state";
import { StatisticsStore } from "./statistics/statistics-store";

/**
 * A store that holds the application store and provides methods to access and update it.
 */
export class AppStore {
	private readonly _statistics: StatisticsStore;
	private readonly _store = createStore<AppState>()(
		subscribeWithSelector(() => initialAppState),
	);

	constructor() {
		this._statistics = new StatisticsStore(
			this._store.getState,
			this._store.setState,
		);
	}

	/**
	 * Gets the current application store. Use this method to retrieve the entire store of the application.
	 *
	 * @return The current application store.
	 */
	get state(): AppState {
		return this._store.getState();
	}

	/**
	 * Gets the statistics store, which provides methods to manipulate the statistics store in the application.
	 *
	 * @return The statistics store.
	 */
	get statistics(): StatisticsStore {
		return this._statistics;
	}

	/**
	 * Subscribes to changes in the application store based on a selector function. The listener will be called whenever
	 * the selected value changes.
	 *
	 * @example
	 * ```typescript
	 * const unsubscribe = appStore.subscribe(
	 *   (store) => store.statistics.activeStatistic,
	 *   (newValue, previousValue) => {
	 *     console.log('Active statistic changed from', previousValue, 'to', newValue);
	 *   }
	 * );
	 *
	 * @param selector A function that selects a part of the application store to listen to.
	 * @param listener A function that will be called with the new and previous values of the selected store whenever it changes.
	 */
	subscribe<T>(
		selector: (state: AppState) => T,
		listener: (value: T, previousValue: T) => void,
	): () => void {
		return this._store.subscribe(selector, listener);
	}
}
