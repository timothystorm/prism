import { z } from "zod";

/**
 * Validates a time-only string in HH:MM or HH:MM:SS format without conversion or normalization.
 * Time zone offsets and fractional seconds are not accepted.
 */
export const TimeOnlySchema = z.union([
  z.iso.time({ precision: -1 }),
  z.iso.time({ precision: 0 }),
]);

/**
 * Validates a same-day time range, preserving the user's time strings without time zone conversion.
 * The start must be strictly before the end; equal endpoints and overnight ranges are not accepted.
 * Omitted seconds are treated as zero for comparison only; the original strings are preserved.
 *
 * @example
 * const timeRange = TimeRangeSchema.parse({
 *   start: "09:00:00",
 *   end: "17:30:00",
 * });
 */
export const TimeRangeSchema = z
  .object({
    start: TimeOnlySchema,
    end: TimeOnlySchema,
  })
  .refine(
    ({ start, end }) => {
      const startWithSeconds = start.length === 5 ? `${start}:00` : start;
      const endWithSeconds = end.length === 5 ? `${end}:00` : end;
      return startWithSeconds < endWithSeconds;
    },
    {
      message: "[start] time must be before [end] time",
      path: ["end"],
    },
  );

/**
 * Types for time-only ranges.
 */
export type TimeRange = z.infer<typeof TimeRangeSchema>;
