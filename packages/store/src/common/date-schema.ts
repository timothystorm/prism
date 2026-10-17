import { Temporal } from "@js-temporal/polyfill";
import { z } from "zod";

/**
 * A schema for a date-only string in the format "YYYY-MM-DD". This schema is useful for validating and transforming
 * date-only strings in applications that need to handle dates without time components.
 */
export const DateOnlySchema = z.iso.date();

const TimeZoneSchema = z.string().refine(
	(timeZone) => {
		if (/^[+-]/.test(timeZone)) return false;
		try {
			Temporal.Instant.fromEpochMilliseconds(0).toZonedDateTimeISO(timeZone);
			return true;
		} catch (error) {
			if (error instanceof RangeError) return false;
			throw error;
		}
	},
	{ error: "Use a valid IANA time zone name, not a numeric offset" },
);

/**
 * Converts date-only strings in a time zone to { start: Date, end: Date } UTC instants.
 * The start date must be at or before the end date. The time zone defaults to the user's local time zone at parse time.
 * The range includes the start day's midnight through the final day's last millisecond, accounting for DST changes.
 *
 * DO NOT USE offset-based time zones (e.g., "UTC+2") as they do not accounts for daylight saving time changes! Use
 * IANA time zone names (e.g., "America/New_York") instead.
 *
 * @example
 * ```typescript
 * // use the browser's local time zone by default
 * const dateRange = DateRangeSchema.parse({
 *   start: "2023-01-01",
 *   end: "2023-01-31",
 * });
 *
 * // target a specific time zone
 * const dateRangeWithTimeZone = DateRangeSchema.parse({
 *   start: "2023-01-01",
 *   end: "2023-01-31",
 *   timeZone: "America/New_York",
 * });
 * ```
 */
export const DateRangeSchema = z
	.object({
		start: DateOnlySchema,
		end: DateOnlySchema,
		timeZone: TimeZoneSchema.default(
			() => Intl.DateTimeFormat().resolvedOptions().timeZone,
		),
	})
	.refine(({ start, end }) => start <= end, {
		error: "[start] date must be at or before [end] date",
		path: ["end"],
	})
	.transform(({ start, end, timeZone }) => {
		// transform the date range into a range of Date objects in the specified time zone, with the start date at midnight
		// and the end date at 23:59:59.999
		const startDate = Temporal.PlainDate.from(start);
		const endDate = Temporal.PlainDate.from(end);

		const zonedStartDate = startDate.toZonedDateTime({
			timeZone,
			plainTime: "00:00:00",
		});

		// Start of the day AFTER the selected end date.  calculating the next day's midnight is generally more robust,
		// especially when dealing with daylight saving time changes, than simply adding 24 hours to the end date. Some days
		// have 23 hours. Others have 25. Subtracting 1 millisecond from the next day's midnight ensures that the end of the
		// range is inclusive of the entire selected end date, regardless of any DST changes
		const zonedEndDate = endDate.add({ days: 1 }).toZonedDateTime({
			timeZone,
			plainTime: "00:00:00",
		});

		return {
			start: new Date(zonedStartDate.toInstant().epochMilliseconds),
			end: new Date(
				zonedEndDate.toInstant().epochMilliseconds -
					1 /* subtract 1 millisecond to make it inclusive */,
			),
		};
	});

export type DateRange = z.infer<typeof DateRangeSchema>;

/**
 * Accepts both user-entered date-only strings and Date objects from stored filter state.
 * Strings are converted by DateRangeSchema using the supplied or local time zone.
 * Existing Dates are validated for chronological order and copied without timezone conversion.
 *
 * Filter schemas validate both incoming input and state replacements. DateRangeSchema alone cannot
 * validate its own output because it expects strings but returns Dates. This union allows a date
 * filter to be validated again when restoring or replacing state.
 *
 * @example
 * ```typescript
 * // Convert user input to UTC instants using the selected time zone.
 * const range = FilterDateRangeSchema.parse({
 *   start: "2026-10-17",
 *   end: "2026-10-18",
 *   timeZone: "America/Chicago",
 * });
 * // range.start is 2026-10-17T05:00:00.000Z.
 * // range.end is 2026-10-19T04:59:59.999Z.
 *
 * // Revalidate Dates from stored state without converting them again.
 * const restored = FilterDateRangeSchema.parse(range);
 * // restored has the same timestamps as range, with new Date instances.
 *
 * // DateRangeSchema.parse(range) would throw: it only accepts date-only strings.
 * ```
 */
export const FilterDateRangeSchema = z.union([
	DateRangeSchema,
	z
		.object({ start: z.date(), end: z.date() })
		.refine(({ start, end }) => start <= end, {
			error: "[start] date must be at or before [end] date",
			path: ["end"],
		})
		.transform(({ start, end }) => ({
			start: new Date(start),
			end: new Date(end),
		})),
]);
