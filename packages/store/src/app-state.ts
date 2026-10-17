import { z } from "zod";
import {
	AccountsStateSchema,
	initialAccountsState,
} from "./accounts/accounts-state";
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
	account: AccountsStateSchema,
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
	account: initialAccountsState,
	metrics: initialMetricsState,
	columns: initialColumnsState,
	statuses: initialStatusesState,
	filters: initialFiltersState,
};
