import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import { type Search, SearchSchema } from "./search-schema";
import { SearchStateSchema } from "./search-state";

/**
 * Provides validated, immutable access to the current search query and category.
 * Use getSearchTerm()/setSearchTerm() to read or replace the selection, and inherited
 * getState()/setState() to read or replace the full slice, including its dirty flag.
 * Returned objects are store-owned snapshots and must not be mutated directly.
 *
 * Search updates preserve dirty and supplied query text. Controllers manage dirty status,
 * query normalization, category-specific rules, and executing searches; the store only holds state.
 *
 * @example
 * appStore.search.setSearchTerm({
 *   query: "REF-123",
 *   category: "SHIPPER_REFERENCE",
 * });
 * const search = appStore.search.getSearchTerm();
 * appStore.search.setSearchTerm({ query: "", category: search.category });
 */
export class SearchStore extends BaseStore<"search"> {
	protected readonly sliceKey = "search";
	protected readonly stateSchema = SearchStateSchema;

	/**
	 * Returns the query/category selection from the current search-state snapshot.
	 * This is a store-owned reference, not a defensive copy. Use getState() to access dirty.
	 *
	 * @return The current search selection.
	 */
	getSearchTerm(): Search {
		return this.getState();
	}

	/**
	 * Replaces query and category together without changing the dirty flag.
	 * Both fields are required; an empty query clears the search in the supplied category.
	 * Input is validated and detached, and query text is preserved exactly as supplied.
	 * Any extra dirty field in the input is ignored; only state replacement manages that flag.
	 *
	 * @param search The complete query/category selection.
	 * @throws ZodError If the selection is invalid. State and subscriptions remain unchanged.
	 */
	setSearchTerm(search: Search): void {
		const validated = SearchSchema.parse(search);
		this.setAppState(
			produce<AppState>((state) => {
				state.search = { ...state.search, ...validated };
			}),
		);
	}
}
