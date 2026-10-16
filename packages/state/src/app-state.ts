import { z } from "zod";
import {
	ColumnsStateSchema,
	initialColumnsState,
} from "./columns/columns-state";
import {
	initialStatisticsState,
	StatisticsStateSchema,
} from "./statistics/statistics-state";

/**
 * Schema for the entire application state.
 */
export const AppStateSchema = z.object({
	statistics: StatisticsStateSchema,
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
	statistics: initialStatisticsState,
	columns: initialColumnsState,
};
