import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import { type Status, StatusSchema } from "./statuses-schema";
import { StatusesStateSchema } from "./statuses-state";

/**
 * A class that provides actions to manipulate the statuses state in the application.
 *
 * This should only manage state and not contain any business logic. It is designed to be used with a state management
 * library like Zustand but should not be tied to any specific implementation - no Zustand types should be used here.
 */
export class StatusesStore extends BaseStore<"statuses"> {
	protected readonly sliceKey = "statuses";
	protected readonly stateSchema = StatusesStateSchema;

	/**
	 * Appends a valid status unless already selected, without changing the dirty flag.
	 * Duplicate additions leave state and subscriptions unchanged.
	 */
	addSelectedStatus(status: string): Status[] {
		const validated = StatusSchema.parse(status);
		this.setState(
			produce<AppState>((state) => {
				if (state.statuses.selectedStatuses.includes(validated)) return;
				state.statuses.selectedStatuses.push(validated);
			}),
		);
		return this.state.selectedStatuses;
	}

	/**
	 * @return The currently selected parent and child status identifiers, or an empty array if none are selected.
	 */
	get selectedStatuses(): string[] {
		return this.state?.selectedStatuses ?? [];
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
			produce<AppState>((state) => {
				state.statuses.selectedStatuses = validated;
			}),
		);
	}
}
