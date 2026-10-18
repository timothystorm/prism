import { z } from "zod";
import { MetricTypeSchema } from "./metrics-schema";

/**
 * Schema for the active metric and metrics selected for display in the current view.
 * selectedMetrics preserves display order and contains unique metric identifiers.
 * The dirty flag is controller-managed.
 * The flag can track changes awaiting distribution; metric updates do not toggle it.
 * Stored activeMetric is a metric identifier or null; omitted and undefined inputs normalize to null.
 * The active metric is independent of the metrics selected for display.
 *
 * @example
 * const metricsState: MetricsState = {
 *   activeMetric: "EXCEPTION",
 *   selectedMetrics: ["EXCEPTION", "CUSTOM:MY_METRIC"],
 *   dirty: false
 * };
 */
export const MetricsStateSchema = z.object({
	activeMetric: MetricTypeSchema.nullable().default(null),

	selectedMetrics: z
		.array(MetricTypeSchema)
		.refine((metrics) => new Set(metrics).size === metrics.length, {
			message: "Selected metrics must be unique",
		}),
	dirty: z.boolean().default(false),
});

export type MetricsState = z.infer<typeof MetricsStateSchema>;

/**
 * Initial state for metrics.
 */
export const initialMetricsState: MetricsState = {
	activeMetric: null,
	selectedMetrics: [],
	dirty: false,
};
