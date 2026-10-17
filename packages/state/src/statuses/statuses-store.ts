import { produce } from "immer";
import type { AppState } from "../app-state";
import { type StatusesState, StatusesStateSchema } from "./statuses-state";

/**
 * A class that provides actions to manipulate the statuses state in the application.
 *
 * This should only manage state and not contain any business logic. It is designed to be used with a state management
 * library like Zustand but should not be tied to any specific implementation - no Zustand types should be used here.
 */
export class StatusesStore {
	/**
	 * Creates an instance of StatusesStore.
	 *
	 * @param getState A function that returns the current application state.
	 * @param setState A function that updates the application state based on a provided updater function.
	 */
	constructor(
		private readonly getState: () => AppState,
		private readonly setState: (
			updater: (state: AppState) => Partial<AppState>,
		) => void,
	) {}

	/**
	 * Gets the current statuses state from the application.
	 *
	 * @return The current statuses state.
	 */
	get state(): StatusesState {
		return this.getState().statuses;
	}

	/**
	 * Replaces the entire statuses state with the provided state.
	 *
	 * @param state The new statuses state to set.
	 * @throws ZodError If the state is invalid. The state remains unchanged.
	 */
	set state(state: StatusesState) {
		const validated = StatusesStateSchema.parse(state);
		this.setState(
			produce<AppState>((appState) => {
				appState.statuses = validated;
			}),
		);
	}

	/**
	 * @return The currently selected parent and child status identifiers, or an empty array if none are selected.
	 */
	get selectedStatuses(): string[] {
		return this.getState().statuses?.selectedStatuses ?? [];
	}

	/**
	 * Sets the selected status identifiers as independent OR terms without expanding or collapsing selections.
	 * An empty array clears the selections.
	 *
	 * @param statuses The parent and child status identifiers to set as selected.
	 * @throws ZodError If the selections are invalid. The state remains unchanged.
	 */
	set selectedStatuses(statuses: string[]) {
		const validated =
			StatusesStateSchema.shape.selectedStatuses.parse(statuses);
		this.setState(
			produce<AppState>((appState) => {
				appState.statuses.selectedStatuses = validated;
			}),
		);
	}
}
