import { z } from "zod";
import { LoadingStateSchema } from "./loading-state";
import {
	initialStatisticsState,
	StatisticsStateSchema,
} from "./statistics/statistics-state";

/**
 * Schema for the entire application store.
 */
export const AppStateSchema = z.object({
	// The statistics store
	statistics: StatisticsStateSchema.extend(LoadingStateSchema.shape),
});

/**
 * Types for the entire application store.
 */
export type AppState = z.infer<typeof AppStateSchema>;

/**
 * Initial store for the entire application.
 */
export const initialAppState: AppState = {
	statistics: initialStatisticsState,
};
