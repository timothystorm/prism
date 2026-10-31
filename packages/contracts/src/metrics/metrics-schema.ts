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
  "AT_RISK",
  "DELAYED",
  "DELIVERED",
  "DELIVERED_TODAY",
  "DELIVERING_TODAY",
  "DELIVERY_UPDATED",
  "EARLY",
  "EXCEPTION",
  "IN_TRANSIT",
  "LABEL_CREATED",
  "MISSED_PROMISE",
  "ON_TIME",
  "OUT_FOR_DELIVERY",
  "RETURN_TO_SHIPPER",
  "WATCH_LIST",
  "WE_TRIED_TO_DELIVER",
]);
/**
 * Schema for custom metric identifiers prefixed with CUSTOM:.
 * The suffix is currently unconstrained, including an empty string. Validation does not
 * establish that a corresponding metric definition exists.
 *
 * @example
 * const customMetric: MetricType = "CUSTOM:MY_CUSTOM_METRIC";
 */
export const CustomMetricTypeSchema = z.templateLiteral(["CUSTOM:", z.string()]);

/** Validates metric identifiers only, without loading or calculating their values. */
export const MetricTypeSchema = z.union([BuiltInMetricTypeSchema, CustomMetricTypeSchema]);

/**
 * Types for metric identifiers.
 */
export type MetricType = z.infer<typeof MetricTypeSchema>;
