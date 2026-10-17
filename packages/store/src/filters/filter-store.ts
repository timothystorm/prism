import equal from "fast-deep-equal";
import { produce } from "immer";
import type { z } from "zod";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import { type Filter, FilterSchema } from "./filters-schema";
import { FilterStateSchema } from "./filters-state";

export class FilterStore extends BaseStore<"filters"> {
	protected readonly sliceKey = "filters";
	protected readonly stateSchema = FilterStateSchema;

	/**
	 * Adds a filter or replaces its criteria in place without changing the dirty flag.
	 * Equivalent parsed criteria leave state and subscriptions unchanged.
	 * Date criteria accept date-only strings for conversion or already-normalized Dates.
	 */
	addActiveFilter(filter: z.input<typeof FilterSchema>): Filter[] {
		const validated = FilterSchema.parse(filter);
		this.setState(
			produce<AppState>((state) => {
				const index = state.filters.active.findIndex(
					(active) => active.type === validated.type,
				);
				const existing = state.filters.active[index];
				if (existing && equal(existing.criteria, validated.criteria)) return; // No change, so don't update state
				if (index === -1) state.filters.active.push(validated);
				else state.filters.active[index] = validated;
			}),
		);
		return this.state.active;
	}

	/**
	 * Removes a filter by type without changing the dirty flag.
	 * Missing types leave state and subscriptions unchanged.
	 * @return The remaining active filters.
	 */
	removeActiveFilter(filterType: string): Filter[] {
		this.setState(
			produce<AppState>((state) => {
				const index = state.filters.active.findIndex(
					(active) => active.type === filterType,
				);
				if (index !== -1) {
					state.filters.active.splice(index, 1);
				}
			}),
		);
		return this.state.active;
	}
}
