import { z } from "zod";
import { MetricTypeSchema } from "./metrics-schema";

/**
 * Schema for the metrics state.
 *
 * @example
 * const MetricsState: MetricsState = {
 *   focusedMetric: "exceptions",
 *   trackedMetrics: ["exceptions", "custom:my_custom_stat"]
 * };
 */
export const MetricsStateSchema = z.object({
	// The currently focused metric, which can be null.
	focusedMetric: MetricTypeSchema.nullish(),

	// The list of selected metrics, which can be empty.
	trackedMetrics: z.array(MetricTypeSchema),
});

export type MetricsState = z.infer<typeof MetricsStateSchema>;

/**
 * Initial state for metrics.
 */
export const initialMetricsState: MetricsState = {
	focusedMetric: null,
	trackedMetrics: [],
};
