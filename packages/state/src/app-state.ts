import { z } from "zod";
import {
	ColumnsStateSchema,
	initialColumnsState,
} from "./columns/columns-state";
import {
	initialMetricsState,
	MetricsStateSchema,
} from "./metrics/metrics-state";

/**
 * Schema for the entire application state.
 */
export const AppStateSchema = z.object({
	metrics: MetricsStateSchema,
	columns: ColumnsStateSchema,
});

/**
 * Types for the entire application state.
 */
export type AppState = z.infer<typeof AppStateSchema>;

/**
 * Initial state for the entire application.
 */
export const initialAppState: AppState = {
	metrics: initialMetricsState,
	columns: initialColumnsState,
};
