import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import { type Columns, ColumnsSchema } from "./columns-schema";
import { ColumnsStateSchema } from "./columns-state";

/**
 * A class that provides actions to manipulate the columns state in the application.
 *
 * This should only manage state and not contain any business logic. It is designed to be used with a state management
 * library like Zustand but should not be tied to any specific implementation - no Zustand types should be used here.
 */
export class ColumnsStore extends BaseStore<"columns"> {
	protected readonly sliceKey = "columns";
	protected readonly stateSchema = ColumnsStateSchema;

	/**
	 * @return The currently selected columns in display order.
	 */
	get selectedColumns(): Columns {
		return this.state.selectedColumns;
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
