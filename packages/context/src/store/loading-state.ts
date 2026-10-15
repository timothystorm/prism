import { z } from "zod";

/**
 * Schema for the loading store. Good for adding a loading indicator to the UI.
 *
 * @example
 * export const AppStateSchema = z.object({
 *   statistics: StatisticsStateSchema.extend(LoadingStateSchema.shape)
 * });
 */
export const LoadingStateSchema = z.object({
	loading: z.boolean().optional(),
});

/**
 * Types for the loading store.
 */
export type LoadingState = z.infer<typeof LoadingStateSchema>;
