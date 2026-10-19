import { z } from "zod";

/**
 * Schema for built-in metric identifiers.
 *
 * @example
 * const metric: MetricType = "EXCEPTION";
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
/**
 * Schema for custom metric identifiers prefixed with CUSTOM:.
 *
 * @example
 * const customMetric: MetricType = "CUSTOM:MY_CUSTOM_METRIC";
 */
export const CustomMetricTypeSchema = z.templateLiteral(["CUSTOM:", z.string()]);

export const MetricTypeSchema = z.union([BuiltInMetricTypeSchema, CustomMetricTypeSchema]);

export const MetricValueSchema = z.union([z.string(), z.number(), z.date(), z.boolean()]);

/**
 * Schema for a metric and its optional value, separate from metric selection state.
 *
 * @example
 * const metric: Metric = { type: "EXCEPTION", value: 42 };
 */
export const MetricSchema = z.object({
  type: MetricTypeSchema,
  value: MetricValueSchema.nullish(),
});

/**
 * Types for metric identifiers and values.
 */
export type MetricType = z.infer<typeof MetricTypeSchema>;
export type MetricValue = z.infer<typeof MetricValueSchema>;
export type Metric = z.infer<typeof MetricSchema>;
