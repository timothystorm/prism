import { produce } from "immer";
import type { z } from "zod";
import type { AppState } from "./app-state";

/**
 * Provides validated access and immutable updates for one application state slice.
 * Subclasses supply the slice key and schema while retaining their domain-specific accessors.
 * No state-management-library types are required.
 */
export abstract class BaseStore<K extends keyof AppState> {
	protected abstract readonly sliceKey: K;
	protected abstract readonly stateSchema: z.ZodType<AppState[K]>;

	/**
	 * @param getState A function that returns the current application state.
	 * @param setState A function that updates the application state based on a provided updater function.
	 */
	constructor(
		private readonly getState: () => AppState,
		protected readonly setState: (
			updater: (state: AppState) => Partial<AppState>,
		) => void,
	) {}

	/**
	 * @return The current state of this slice.
	 */
	get state(): AppState[K] {
		return this.getState()[this.sliceKey];
	}

	/**
	 * Replaces this entire slice without changing other application state slices.
	 *
	 * @param state The new slice state to set.
	 * @throws ZodError If the state is invalid. The state remains unchanged.
	 */
	set state(state: AppState[K]) {
		const validated = this.stateSchema.parse(state);
		this.setState(
			produce<AppState>((appState) => {
				appState[this.sliceKey] = validated;
			}),
		);
	}
}
