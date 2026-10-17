import { describe, expect, test } from "vitest";
import { DateRangeSchema } from "./date-schema";

describe("DateRangeSchema", () => {
	test.each([
		{
			start: "2026-10-17T16:05:02.359Z",
			end: "2026-10-22T09:30:45.012Z",
		},
		{
			start: "2026-10-17T16:05:02.359Z",
			end: "2026-10-17T16:05:02.359Z",
		},
		{
			start: "2028-02-29T12:00:00.000Z",
			end: "2028-03-01T01:00:00.000Z",
		},
	])(
		"preserves UTC timestamps without conversion or day-boundary changes: %j",
		(range) => {
			expect(DateRangeSchema.parse(range)).toEqual(range);
		},
	);

	test("reports reversed timestamps on end", () => {
		const result = DateRangeSchema.safeParse({
			start: "2026-10-17T16:05:02.360Z",
			end: "2026-10-17T16:05:02.359Z",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([expect.objectContaining({ path: ["end"] })]),
			);
		}
	});

	test.each([
		null,
		{},
		{ start: "2026-10-17T00:00:00.000Z" },
		{ end: "2026-10-18T23:59:59.999Z" },
		{ start: "2026-10-17", end: "2026-10-18" },
		{ start: "2026-02-30T00:00:00.000Z", end: "2026-03-01T23:59:59.999Z" },
		{ start: "2026-10-17T00:00:00Z", end: "2026-10-18T23:59:59Z" },
		{ start: "2026-10-17T00:00:00.000", end: "2026-10-18T23:59:59.999" },
		{
			start: "2026-10-17T00:00:00.000-06:00",
			end: "2026-10-18T23:59:59.999-06:00",
		},
		{
			start: "2026-10-17T00:00:00.000+00:00",
			end: "2026-10-18T23:59:59.999+00:00",
		},
		{ start: "", end: "2026-10-18T23:59:59.999Z" },
		{ start: "2026-10-17T00:00:00.000Z", end: "invalid" },
		{ start: null, end: "2026-10-18T23:59:59.999Z" },
		{ start: 0, end: "2026-10-18T23:59:59.999Z" },
		{
			start: new Date("2026-10-17T00:00:00.000Z"),
			end: new Date("2026-10-18T23:59:59.999Z"),
		},
	])("rejects missing or invalid UTC millisecond timestamps: %j", (range) => {
		expect(DateRangeSchema.safeParse(range).success).toBe(false);
	});
});
