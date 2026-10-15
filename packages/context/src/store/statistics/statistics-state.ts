import { z } from "zod";

/**
 * Schemas and types for statistics store.
 *
 * @example
 * const statistic: Statistic = "exceptions"; // Built-in statistic
 * const customStatistic: Statistic = "custom:my_custom_stat"; // Custom statistic
 */
export const BuiltInStatisticSchema = z.enum(["exceptions", "label_created"]);
export const CustomStatisticSchema = z.templateLiteral(["custom:", z.string()]);
export const StatisticSchema = z.union([
	BuiltInStatisticSchema,
	CustomStatisticSchema,
]);

/**
 * Schema for the statistics store.
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

/**
 * Types for statistics store.
 */
export type Statistic = z.infer<typeof StatisticSchema>;
export type StatisticsState = z.infer<typeof StatisticsStateSchema>;

/**
 * Initial store for statistics.
 */
export const initialStatisticsState: StatisticsState = {
	selectedStatistics: [],
	activeStatistic: null,
};
