import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import type { View } from "./views-schema";
import { ViewsStateSchema } from "./views-state";

/**
 * Provides validated, immutable access to custom view metadata and the current view identifier.
 * This should only manage state and not contain business logic or component configuration.
 * No state-management-library types are required.
 */
export class ViewsStore extends BaseStore<"views"> {
	protected readonly sliceKey = "views";
	protected readonly stateSchema = ViewsStateSchema;

	/** @return The custom view metadata in display order. */
	get custom(): View[] {
		return this.state.custom;
	}

	/**
	 * Replaces custom views without changing the current identifier or dirty flag.
	 * Removing the current view's metadata does not change the current identifier.
	 *
	 * @param views View metadata with unique, non-empty identifiers and names.
	 * @throws ZodError If metadata is invalid or identifiers are duplicated. The state remains unchanged.
	 */
	set custom(views: View[]) {
		const validated = ViewsStateSchema.parse({ ...this.state, custom: views });
		this.setState(
			produce<AppState>((state) => {
				state.views.custom = validated.custom;
			}),
		);
	}

	/** @return The current view identifier. */
	get current(): string {
		return this.state.current;
	}

	/**
	 * Sets the current view identifier without changing custom views or the dirty flag.
	 *
	 * @param id A non-empty identifier, whether or not it appears in custom views.
	 * @throws ZodError If the identifier is invalid. The state remains unchanged.
	 */
	set current(id: string) {
		const validated = ViewsStateSchema.parse({ ...this.state, current: id });
		this.setState(
			produce<AppState>((state) => {
				state.views.current = validated.current;
			}),
		);
	}
}
