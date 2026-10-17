import { z } from "zod";

/** Validates UTC ISO timestamps with millisecond precision and a Z suffix. */
const UtcTimestampSchema = z.iso.datetime({ precision: 3 });

/**
 * Validates a start/end range of UTC ISO timestamp strings without changing them.
 *
 * Input and output use the same format: YYYY-MM-DDTHH:mm:ss.sssZ. Both endpoints
 * are required, and start must be at or before end; equal endpoints are valid.
 * Date-only strings, Date objects, numeric offsets, and timezone-free timestamps
 * are rejected.
 *
 * This schema validates state, not calendar-day selection rules. It does not
 * resolve timezones, round to day boundaries, or decide whether an interval is
 * inclusive. Controllers must perform any required conversions before updating
 * the store. The same schema validates updates and restored snapshots.
 *
 * Fixed-width UTC formatting makes string ordering match chronological ordering,
 * so validating the range does not require parsing or converting either endpoint.
 *
 * @example
 * const range = DateRangeSchema.parse({
 *   start: "2026-10-17T16:05:02.359Z",
 *   end: "2026-10-22T09:30:45.012Z",
 * });
 * // Both timestamp strings are preserved exactly as supplied.
 *
 * @throws {z.ZodError} When an endpoint is missing, has an invalid format, or
 * start is after end. Use safeParse to receive a validation result instead.
 */
export const DateRangeSchema = z
	.object({
		start: UtcTimestampSchema,
		end: UtcTimestampSchema,
	})
	.refine(({ start, end }) => start <= end, {
		error: "[start] date must be at or before [end] date",
		path: ["end"],
	});

/** A validated UTC string range, shared by store inputs and stored state. */
export type DateRange = z.infer<typeof DateRangeSchema>;
