import { z } from "zod";

/** Validates ISO calendar dates without a time or timezone. */
const CalendarDateSchema = z.iso.date();

/**
 * Validates a start/end range of calendar-date strings without changing them.
 *
 * Input and output use the same format: YYYY-MM-DD. Both endpoints
 * are required, and start must be at or before end; equal endpoints are valid.
 * Timestamps, Date objects, and values containing times or timezone offsets are rejected.
 *
 * This schema validates calendar dates, not instants in time. It does not add
 * times, resolve timezones, or decide how a date range maps to a backend query.
 * The same schema validates updates and restored snapshots.
 *
 * Fixed-width ISO dates sort in calendar order, so validating the range does not
 * require parsing or converting either endpoint.
 *
 * @example
 * const range = DateRangeSchema.parse({
 *   start: "2026-10-17",
 *   end: "2026-10-22",
 * });
 * // Both date strings are preserved exactly as supplied.
 *
 * @throws {z.ZodError} When an endpoint is missing, has an invalid format, or
 * start is after end. Use safeParse to receive a validation result instead.
 */
export const DateRangeSchema = z
  .object({
    start: CalendarDateSchema,
    end: CalendarDateSchema,
  })
  .refine(({ start, end }) => start <= end, {
    error: "[start] date must be at or before [end] date",
    path: ["end"],
  });

/** A validated calendar-date range, shared by store inputs and stored state. */
export type DateRange = z.infer<typeof DateRangeSchema>;
