import { z } from "zod";
import { StatisticSchema } from "./statistics-schema";

/**
 * Schema for the statistics state.
 *
 * @example
 * const statisticsState: StatisticsState = {
 *   activeStatistic: "exceptions",
 *   selectedStatistics: ["exceptions", "custom:my_custom_stat"]
 * };
 */
export const StatisticsStateSchema = z.object({
	// The currently active statistic, which can be null.
	activeStatistic: StatisticSchema.nullish(),

	// An array of user selected statistics, which can be empty.
	selectedStatistics: z.array(StatisticSchema),
});

export type StatisticsState = z.infer<typeof StatisticsStateSchema>;

/**
 * Initial state for statistics.
 */
export const initialStatisticsState: StatisticsState = {
	selectedStatistics: [],
	activeStatistic: null,
};
