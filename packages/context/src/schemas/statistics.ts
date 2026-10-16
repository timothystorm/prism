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
 * Types for statistics store.
 */
export type Statistic = z.infer<typeof StatisticSchema>;
