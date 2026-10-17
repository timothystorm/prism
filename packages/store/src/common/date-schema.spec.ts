import { afterEach, describe, expect, test, vi } from "vitest";
import { DateOnlySchema, DateRangeSchema } from "./date-schema";

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("DateOnlySchema", () => {
	test.each(["2026-10-17", "2028-02-29", "2024-03-17"])(
		"accepts calendar date %s",
		(date) => {
			expect(DateOnlySchema.parse(date)).toBe(date);
		},
	);

	test.each([
		"2026-02-29",
		"2026-04-31",
		"2026-13-01",
		"2026-1-1",
		"2026-10-17T00:00:00Z",
		"",
		null,
		42,
	])("rejects invalid date-only input: %j", (date) => {
		expect(DateOnlySchema.safeParse(date).success).toBe(false);
	});
});

describe("DateRangeSchema", () => {
	test.each([
		{
			start: "2026-10-17",
			end: "2026-10-18",
			timeZone: "UTC",
			expectedStart: "2026-10-17T00:00:00.000Z",
			expectedEnd: "2026-10-18T23:59:59.999Z",
		},
		{
			start: "2026-01-15",
			end: "2026-01-15",
			timeZone: "America/Denver",
			expectedStart: "2026-01-15T07:00:00.000Z",
			expectedEnd: "2026-01-16T06:59:59.999Z",
		},
		{
			start: "2026-03-08",
			end: "2026-03-08",
			timeZone: "America/New_York",
			expectedStart: "2026-03-08T05:00:00.000Z",
			expectedEnd: "2026-03-09T03:59:59.999Z",
		},
		{
			start: "2026-11-01",
			end: "2026-11-01",
			timeZone: "America/New_York",
			expectedStart: "2026-11-01T04:00:00.000Z",
			expectedEnd: "2026-11-02T04:59:59.999Z",
		},
		{
			start: "2028-02-29",
			end: "2028-02-29",
			timeZone: "Asia/Kolkata",
			expectedStart: "2028-02-28T18:30:00.000Z",
			expectedEnd: "2028-02-29T18:29:59.999Z",
		},
	])(
		"converts $start through $end in $timeZone to inclusive UTC instants",
		({ start, end, timeZone, expectedStart, expectedEnd }) => {
			const input = { start, end, timeZone };
			const result = DateRangeSchema.parse(input);

			expect(result).toEqual({
				start: new Date(expectedStart),
				end: new Date(expectedEnd),
			});
			expect(input).toEqual({ start, end, timeZone });
		},
	);

	test("defaults to the local time zone at parse time", () => {
		vi.stubEnv("TZ", "UTC"); // force the test to run in UTC for consistency
		expect(
			DateRangeSchema.parse({ start: "2026-01-15", end: "2026-01-15" }),
		).toEqual({
			start: new Date("2026-01-15T00:00:00.000Z"),
			end: new Date("2026-01-15T23:59:59.999Z"),
		});

		vi.stubEnv("TZ", "America/Denver"); // force the test to run in America/Denver for consistency
		expect(
			DateRangeSchema.parse({ start: "2026-01-15", end: "2026-01-15" }),
		).toEqual({
			start: new Date("2026-01-15T07:00:00.000Z"),
			end: new Date("2026-01-16T06:59:59.999Z"),
		});
	});

	test("reports reversed calendar dates on end", () => {
		const result = DateRangeSchema.safeParse({
			start: "2026-10-18",
			end: "2026-10-17",
			timeZone: "UTC",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([expect.objectContaining({ path: ["end"] })]),
			);
		}
	});

	test.each([
		{},
		{ start: "2026-10-17", timeZone: "UTC" },
		{ end: "2026-10-17", timeZone: "UTC" },
		{ start: "2026-10-18", end: "2026-10-17", timeZone: "UTC" },
		{ start: "2026-02-30", end: "2026-03-01", timeZone: "UTC" },
		{ start: "2026-10-17", end: "invalid", timeZone: "UTC" },
		{ start: "2026-10-17", end: "2026-10-18", timeZone: "Unknown/Zone" },
		{ start: "2026-10-17", end: "2026-10-18", timeZone: "+02:00" },
		{ start: "2026-10-17", end: "2026-10-18", timeZone: "UTC+2" },
		{ start: "2026-10-17T00:00:00Z", end: "2026-10-18", timeZone: "UTC" },
		{
			start: new Date("2026-10-17T00:00:00Z"),
			end: new Date("2026-10-18T00:00:00Z"),
			timeZone: "UTC",
		},
		{ start: null, end: null, timeZone: "UTC" },
	])("rejects invalid calendar ranges and time zones: %j", (input) => {
		expect(DateRangeSchema.safeParse(input).success).toBe(false);
	});
});
