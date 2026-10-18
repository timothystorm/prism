import { produce } from "immer";
import type { z } from "zod";
import type { AppState } from "./app-state";

/**
 * Provides validated access and immutable updates for one application state slice.
 * Use getState() to read a snapshot and setState() to replace the slice.
 * Subclasses supply the slice key and schema while retaining their domain-specific methods.
 * No state-management-library types are required.
 */
export abstract class BaseStore<K extends keyof AppState> {
	protected abstract readonly sliceKey: K;
	protected abstract readonly stateSchema: z.ZodType<AppState[K]>;

	/**
	 * @param getAppState A function that returns the current application state.
	 * @param setAppState A function that updates the application state based on a provided updater function.
	 */
	constructor(
		private readonly getAppState: () => AppState,
		protected readonly setAppState: (
			updater: (state: AppState) => Partial<AppState>,
		) => void,
	) {}

	/**
	 * Returns a store-owned snapshot. Do not mutate its objects or arrays directly.
	 *
	 * @return The current state of this slice.
	 */
	getState(): AppState[K] {
		return this.getAppState()[this.sliceKey];
	}

	/**
	 * Replaces this entire slice without changing other application state slices.
	 * Supply the complete slice, including any dirty flag the controller wants to set.
	 * Use AppStore.setState() instead when several slices must change atomically.
	 *
	 * @param state The new slice state to set.
	 * @throws ZodError If the state is invalid. The state remains unchanged.
	 */
	setState(state: AppState[K]): void {
		const validated = this.stateSchema.parse(state);
		this.setAppState(
			produce<AppState>((appState) => {
				appState[this.sliceKey] = validated;
			}),
		);
	}
}
