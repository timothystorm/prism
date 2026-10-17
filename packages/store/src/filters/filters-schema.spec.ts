import { describe, expect, test } from "vitest";
import { FilterSchema } from "./filters-schema";

const dateTypes = [
	"SHIPMENT:COMMIT_DATE",
	"SHIPMENT:DELIVERED_DATE",
	"SHIPMENT:EST_DELIVERY_DATE",
	"SHIPMENT:SHIP_DATE",
	"SHIPMENT:TENDERED_DATE",
] as const;

const stringArrayTypes = [
	"SHIPMENT:INVOICE_NUMBER",
	"SHIPMENT:LAST_LOCATION",
	"SHIPMENT:PARTNER_CARRIER_NUMBER",
	"SHIPMENT:SERVICE_TYPE",
	"SHIPMENT:SHIPPER_REFERENCE",
	"SHIPPER:SHIPPER_COMPANY",
	"SHIPMENT:SHIPPER_NAME",
	"RECIPIENT:RECEIVED_BY",
	"RECIPIENT:RECIPIENT_COMPANY",
	"RECIPIENT:RECIPIENT_CONTACT_NAME",
] as const;

describe("FilterSchema", () => {
	test.each(dateTypes)("preserves supplied UTC timestamps for %s", (type) => {
		const filter = {
			type,
			criteria: {
				start: "2026-10-17T16:05:02.359Z",
				end: "2026-10-22T09:30:45.012Z",
			},
		};

		expect(FilterSchema.parse(filter)).toEqual(filter);
	});

	test.each(dateTypes)("rejects reversed dates for %s", (type) => {
		expect(
			FilterSchema.safeParse({
				type,
				criteria: {
					start: "2026-10-18T00:00:00.000Z",
					end: "2026-10-17T23:59:59.999Z",
				},
			}).success,
		).toBe(false);
	});

	test.each(dateTypes)(
		"rejects date-only strings, offsets, and Date objects for %s",
		(type) => {
			for (const criteria of [
				{
					start: "2026-10-17",
					end: "2026-10-18",
				},
				{
					start: "2026-10-17T00:00:00.000-06:00",
					end: "2026-10-18T23:59:59.999-06:00",
				},
				{
					start: new Date("2026-10-17T00:00:00.000Z"),
					end: new Date("2026-10-18T23:59:59.999Z"),
				},
			]) {
				expect(FilterSchema.safeParse({ type, criteria }).success).toBe(false);
			}
		},
	);

	test.each([
		{ start: "2026-10-17", end: "2026-10-18" },
		{ start: "2026-10-18T00:00:00.000Z", end: "2026-10-17T23:59:59.999Z" },
		{ start: new Date("invalid"), end: new Date("2026-10-17T23:59:59.999Z") },
		{ start: new Date("2026-10-17T00:00:00.000Z"), end: new Date("invalid") },
		{
			start: new Date("2026-10-18T00:00:00.000Z"),
			end: new Date("2026-10-17T23:59:59.999Z"),
		},
		{ start: new Date("2026-10-17T00:00:00.000Z"), end: "2026-10-18" },
	])("rejects invalid stored date criteria %j", (criteria) => {
		expect(
			FilterSchema.safeParse({ type: "SHIPMENT:COMMIT_DATE", criteria })
				.success,
		).toBe(false);
	});

	test.each(stringArrayTypes)(
		"preserves nonempty string arrays and rejects invalid criteria for %s",
		(type) => {
			expect(FilterSchema.parse({ type, criteria: ["ONE", "TWO"] })).toEqual({
				type,
				criteria: ["ONE", "TWO"],
			});
			for (const criteria of [[], "ONE", [1], [null], null, undefined]) {
				expect(FilterSchema.safeParse({ type, criteria }).success).toBe(false);
			}
		},
	);

	test.each(["SHIPMENT:DESTINATION", "SHIPMENT:ORIGIN"])(
		"validates each location criterion for %s",
		(type) => {
			const criteria = [
				{ type: "CITY", value: "Chicago" },
				{ type: "POSTAL_CODE", value: "00601" },
			];
			expect(FilterSchema.parse({ type, criteria })).toEqual({
				type,
				criteria,
			});
			for (const invalid of [
				[],
				["Chicago"],
				[{ type: "UNKNOWN", value: "Chicago" }],
				[{ type: "CITY", value: 1 }],
			]) {
				expect(
					FilterSchema.safeParse({ type, criteria: invalid }).success,
				).toBe(false);
			}
		},
	);

	test.each(["SHIPMENT:GPS_DELIVERY_LOCATION", "SHIPMENT:SIGNATURE_AVAILABLE"])(
		"defaults %s to false and accepts only boolean criteria",
		(type) => {
			expect(FilterSchema.parse({ type })).toEqual({ type, criteria: false });
			for (const criteria of [false, true]) {
				expect(FilterSchema.parse({ type, criteria })).toEqual({
					type,
					criteria,
				});
			}
			for (const criteria of [null, "false", 0]) {
				expect(FilterSchema.safeParse({ type, criteria }).success).toBe(false);
			}
		},
	);

	test.each(["EARLY", "DELAYED", "ON_TIME"])(
		"accepts delivery prediction %s",
		(criteria) => {
			expect(
				FilterSchema.parse({ type: "SHIPMENT:DELIVERY_PREDICTION", criteria }),
			).toEqual({ type: "SHIPMENT:DELIVERY_PREDICTION", criteria });
		},
	);

	test.each([1, 2, 3, 99])("accepts delivery attempt count %i", (criteria) => {
		expect(
			FilterSchema.parse({
				type: "SHIPMENT:NUMBER_OF_ATTEMPTED_DELIVERIES",
				criteria,
			}),
		).toEqual({ type: "SHIPMENT:NUMBER_OF_ATTEMPTED_DELIVERIES", criteria });
	});

	test.each([0, -1, 4, 100, 1.5, "1", null])(
		"rejects unsupported delivery attempt count %j",
		(criteria) => {
			expect(
				FilterSchema.safeParse({
					type: "SHIPMENT:NUMBER_OF_ATTEMPTED_DELIVERIES",
					criteria,
				}).success,
			).toBe(false);
		},
	);

	test.each([
		{ start: "08:00", end: "17:00" },
		{ start: "08:00:01", end: "17:00:02" },
	])(
		"preserves time-in-network input %j without date conversion",
		(criteria) => {
			expect(
				FilterSchema.parse({ type: "SHIPMENT:TIME_IN_NETWORK", criteria }),
			).toEqual({ type: "SHIPMENT:TIME_IN_NETWORK", criteria });
		},
	);

	test.each([
		null,
		{},
		{ type: "UNKNOWN", criteria: true },
		{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "UNKNOWN" },
		{
			type: "SHIPMENT:TIME_IN_NETWORK",
			criteria: { start: "17:00", end: "08:00" },
		},
		{
			type: "SHIPMENT:TIME_IN_NETWORK",
			criteria: { start: "08:00Z", end: "17:00Z" },
		},
	])("rejects malformed filters %j", (input) => {
		expect(FilterSchema.safeParse(input).success).toBe(false);
	});
});
