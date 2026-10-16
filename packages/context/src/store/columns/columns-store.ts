import { produce } from "immer";
import { type Columns, ColumnsSchema } from "../../schemas/columns";
import type { AppState } from "../app-state";
import { type ColumnsState, ColumnsStateSchema } from "./columns-state";

/**
 * A class that provides actions to manipulate the columns store in the application.
 *
 * This should only manage store and not contain any business logic. It is designed to be used with a store management
 * library like Zustand but should not be tied to any specific implementation - no Zustand types should be used here.
 */
export class ColumnsStore {
	/**
	 * Creates an instance of ColumnsStore.
	 *
	 * @param getState A function that returns the current application store.
	 * @param setState A function that updates the application store based on a provided updater function.
	 */
	constructor(
		private readonly getState: () => AppState,
		private readonly setState: (
			updater: (state: AppState) => Partial<AppState>,
		) => void,
	) {}

	/**
	 * Gets the current columns store from the application. Use this method to retrieve the current store of columns.
	 *
	 * @return The current columns store.
	 */
	get state(): ColumnsState {
		return this.getState().columns;
	}

	/**
	 * Sets the columns store in the application. Use this method to update the columns store with a new store
	 * object. Be cautious when using this method, as it will replace the entire columns store with the provided store.
	 *
	 * @param state The new columns store to set.
	 * @throws ZodError If the state is invalid. The store remains unchanged.
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
	 * @throws ZodError If the selections are invalid. The store remains unchanged.
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
