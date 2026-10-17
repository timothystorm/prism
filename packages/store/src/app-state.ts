import { z } from "zod";
import {
	AccountStateSchema,
	initialAccountState,
} from "./account/account-state";
import {
	ColumnsStateSchema,
	initialColumnsState,
} from "./columns/columns-state";
import {
	FilterStateSchema,
	initialFiltersState,
} from "./filters/filters-state";
import {
	initialMetricsState,
	MetricsStateSchema,
} from "./metrics/metrics-state";
import {
	initialStatusesState,
	StatusesStateSchema,
} from "./statuses/statuses-state";

/**
 * Schema for the entire application state.
 */
export const AppStateSchema = z.object({
	account: AccountStateSchema,
	metrics: MetricsStateSchema,
	columns: ColumnsStateSchema,
	statuses: StatusesStateSchema,
	filters: FilterStateSchema,
});

/**
 * Types for the entire application state.
 */
export type AppState = z.infer<typeof AppStateSchema>;

/**
 * Initial state for the entire application.
 */
export const initialAppState: AppState = {
	account: initialAccountState,
	metrics: initialMetricsState,
	columns: initialColumnsState,
	statuses: initialStatusesState,
	filters: initialFiltersState,
};
