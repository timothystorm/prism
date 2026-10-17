import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import type { View } from "./views-schema";
import { ViewsStateSchema } from "./views-state";

/**
 * Provides validated, immutable access to view metadata and selection identifiers.
 * This should only manage state and not contain business logic or component configuration.
 * No state-management-library types are required.
 */
export class ViewsStore extends BaseStore<"views"> {
	protected readonly sliceKey = "views";
	protected readonly stateSchema = ViewsStateSchema;

	/** @return The user-created views in display order, excluding the built-in view. */
	get created(): View[] {
		return this.state.created;
	}

	/**
	 * Replaces created views without changing selections or the dirty flag.
	 * Use state replacement to remove a referenced view and change its selections atomically.
	 *
	 * @param views View metadata with unique, non-empty identifiers and names.
	 * @throws ZodError If metadata or retained selections are invalid. The state remains unchanged.
	 */
	set created(views: View[]) {
		const validated = ViewsStateSchema.parse({ ...this.state, created: views });
		this.setState(
			produce<AppState>((state) => {
				state.views.created = validated.created;
			}),
		);
	}

	/** @return The current view identifier. */
	get current(): string {
		return this.state.current;
	}

	/**
	 * Sets the current view identifier without changing the default or dirty flag.
	 *
	 * @param id The built-in identifier or an existing created view identifier.
	 * @throws ZodError If the identifier is unavailable. The state remains unchanged.
	 */
	set current(id: string) {
		const validated = ViewsStateSchema.parse({ ...this.state, current: id });
		this.setState(
			produce<AppState>((state) => {
				state.views.current = validated.current;
			}),
		);
	}

	/** @return The default view identifier. */
	get default(): string {
		return this.state.default;
	}

	/**
	 * Sets the default view identifier without changing the current view or dirty flag.
	 *
	 * @param id The built-in identifier or an existing created view identifier.
	 * @throws ZodError If the identifier is unavailable. The state remains unchanged.
	 */
	set default(id: string) {
		const validated = ViewsStateSchema.parse({ ...this.state, default: id });
		this.setState(
			produce<AppState>((state) => {
				state.views.default = validated.default;
			}),
		);
	}
}
