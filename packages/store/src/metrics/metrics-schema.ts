import { MetricTypeSchema } from "@fedex/prism-contracts";
import { z } from "zod";

export {
  BuiltInMetricTypeSchema,
  CustomMetricTypeSchema,
  type MetricType,
  MetricTypeSchema,
} from "@fedex/prism-contracts";

/**
 * Runtime metric results, not a shared JSON wire-format contract.
 * Date instances are accepted but are not automatically revived after JSON serialization.
 */
export const MetricValueSchema = z.union([z.string(), z.number(), z.date(), z.boolean()]);

/**
 * Schema for a metric and its optional value, separate from metric selection state.
 * An omitted or null value is allowed; parsing a result does not activate or display the metric.
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
export type MetricValue = z.infer<typeof MetricValueSchema>;
export type Metric = z.infer<typeof MetricSchema>;
