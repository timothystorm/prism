import type { Filter, FilterSchema } from "@fedex/prism-contracts";
import { produce } from "immer";
import type { z } from "zod";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import { FilterStateSchema } from "./filters-state";

/**
 * Provides validated, immutable access to active shipment filters, with one entry per filter type.
 * Use getActiveFilters() to read the ordered selection and setActiveFilters() to replace it.
 * An empty array clears the selection. Use getState()/setState() to read or replace the full slice,
 * including its controller-managed dirty flag.
 *
 * Filter actions preserve the dirty flag. Controllers manage dirty status and query-specific
 * interpretation of temporal ranges. Calendar dates, UTC datetimes, and time-only criteria
 * retain their supplied strings without conversion.
 * Returned selections are store-owned snapshots and must not be mutated directly.
 *
 * @example
 * ```typescript
 * appStore.filters.setActiveFilters([
 *   { type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "DELAYED" },
 * ]);
 * const activeFilters = appStore.filters.getActiveFilters();
 * appStore.filters.setActiveFilters([]);
 * ```
 */
export class FilterStore extends BaseStore<"filters"> {
  protected readonly sliceKey = "filters";
  protected readonly stateSchema = FilterStateSchema;

  /** @return The active filters in selection order, or an empty array if none are selected. */
  getActiveFilters(): Filter[] {
    return this.getState().activeFilters;
  }

  /**
   * Validates and replaces the entire active-filter list without changing the dirty flag.
   * An empty array clears the selection. Parsing detaches input data and applies schemas defaults.
   * Replacements create new references even when their contents are equal.
   *
   * @param filters The complete replacement list, with unique filter types.
   * @throws ZodError If the list is invalid. The state remains unchanged.
   */
  setActiveFilters(filters: z.input<typeof FilterSchema>[]): void {
    const validated = FilterStateSchema.shape.activeFilters.parse(filters);
    this.setAppState(
      produce<AppState>((state) => {
        state.filters.activeFilters = validated;
      }),
    );
  }
}
