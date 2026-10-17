import { produce } from "immer";
import type { AppState } from "../app-state";
import { type Columns, ColumnsSchema } from "./columns-schema";
import { type ColumnsState, ColumnsStateSchema } from "./columns-state";

/**
 * A class that provides actions to manipulate the columns state in the application.
 *
 * This should only manage state and not contain any business logic. It is designed to be used with a state management
 * library like Zustand but should not be tied to any specific implementation - no Zustand types should be used here.
 */
export class ColumnsStore {
	/**
	 * Creates an instance of ColumnsStore.
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
	 * Gets the current columns state from the application. Use this method to retrieve the current state of columns.
	 *
	 * @return The current columns state.
	 */
	get state(): ColumnsState {
		return this.getState().columns;
	}

	/**
	 * Sets the columns state in the application. Use this method to update the columns state with a new state
	 * object. Be cautious when using this method, as it will replace the entire columns state with the provided state.
	 *
	 * @param state The new columns state to set.
	 * @throws ZodError If the state is invalid. The state remains unchanged.
	 */
	set state(state: ColumnsState) {
		const validated = ColumnsStateSchema.parse(state);
		this.setState(
			produce<AppState>((appState) => {
				appState.columns = validated;
			}),
		);
	}

	/**
	 * @return The currently selected columns in display order.
	 */
	get selectedColumns(): Columns {
		return this.getState().columns?.selectedColumns;
	}

	/**
	 * Sets the currently selected columns in display order. Column names must be unique, and trackId is required.
	 *
	 * @param columns The columns to set as selected.
	 * @throws ZodError If the selections are invalid. The state remains unchanged.
	 */
	set selectedColumns(columns: Columns) {
		const validated = ColumnsSchema.parse(columns);
		this.setState(
			produce<AppState>((state) => {
				state.columns.selectedColumns = validated;
			}),
		);
	}
}
