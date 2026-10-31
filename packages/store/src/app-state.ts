import { z } from "zod";

import { AccountsStateSchema, initialAccountsState } from "./accounts/accounts-state";
import { ColumnsStateSchema, initialColumnsState } from "./columns/columns-state";
import { FilterStateSchema, initialFiltersState } from "./filters/filters-state";
import { initialMetricsState, MetricsStateSchema } from "./metrics/metrics-state";
import { initialSearchState, SearchStateSchema } from "./search/search-state";
import { initialStatusesState, StatusesStateSchema } from "./statuses/statuses-state";
import { initialTrackIds, TrackIdsSchema } from "./track-ids/track-ids-schema";
import { initialViewsState, ViewsStateSchema } from "./views/views-state";

/**
 * Validates a complete application selection snapshot, composing slice-specific invariants.
 * Defaults belong to each slice schema; this does not merge missing slices with initialAppState.
 * Tracking IDs are an optional flat array, unlike the other slices' state objects, and
 * have no dirty flag. Loaded accounts and metric result values are not stored here.
 */
export const AppStateSchema = z.object({
  account: AccountsStateSchema,
  metrics: MetricsStateSchema,
  columns: ColumnsStateSchema,
  statuses: StatusesStateSchema,
  filters: FilterStateSchema,
  views: ViewsStateSchema,
  search: SearchStateSchema,
  trackIds: TrackIdsSchema,
});

/**
 * Types for the entire application state.
 */
export type AppState = z.infer<typeof AppStateSchema>;

/**
 * Shared seed values for new application stores. Treat this object and its nested values
 * as read-only; update live selections through AppStore rather than mutating this seed.
 */
export const initialAppState: AppState = {
  account: initialAccountsState,
  metrics: initialMetricsState,
  columns: initialColumnsState,
  statuses: initialStatusesState,
  filters: initialFiltersState,
  views: initialViewsState,
  search: initialSearchState,
  trackIds: initialTrackIds,
};
