import { z } from "zod";

/**
 * Schema for the metrics state.
 *
 * @example
 * const metric: Metric = "EXCEPTIONS"; // Built-in metric
 * const customMetric: Metric = "CUSTOM:MY_CUSTOM_METRIC"; // Custom metric
 */
export const BuiltInMetricTypeSchema = z.enum([
	"ACTIVE_SHIPMENTS",
	"ARRIVING_EARLY",
	"DELAYED",
	"DELIVERED",
	"DELIVERED_TODAY",
	"DELIVERING_TODAY",
	"DELIVERY_UPDATED",
	"EXCEPTION",
	"IN_TRANSIT",
	"LABEL_CREATED",
	"MISSED_PROMISE",
	"ON_TIME",
	"OUT_FOR_DELIVERY",
	"RETURN_TO_SHIPPER",
	"AT_RISK",
	"WATCH_LIST",
	"WE_TRIED_TO_DELIVER",
]);
export const CustomMetricTypeSchema = z.templateLiteral([
	"CUSTOM:",
	z.string(),
]);

export const MetricTypeSchema = z.union([
	BuiltInMetricTypeSchema,
	CustomMetricTypeSchema,
]);

export const MetricValueSchema = z.union([
	z.string(),
	z.number(),
	z.date(),
	z.boolean(),
]);

export const MetricSchema = z.object({
	type: MetricTypeSchema,
	value: MetricValueSchema.nullish(),
});

/**
 * Types for metrics state.
 */
export type MetricType = z.infer<typeof MetricTypeSchema>;
export type MetricValue = z.infer<typeof MetricValueSchema>;
export type Metric = z.infer<typeof MetricSchema>;
