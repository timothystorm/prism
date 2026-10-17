import { describe, expect, test } from "vitest";
import { FilterStateSchema, initialFiltersState } from "./filters-state";

describe("FilterStateSchema", () => {
	test("defaults dirty to false without changing filter order", () => {
		expect(
			FilterStateSchema.parse({
				active: [
					{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-1"] },
					{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" },
				],
			}),
		).toEqual({
			active: [
				{ type: "SHIPMENT:INVOICE_NUMBER", criteria: ["INV-1"] },
				{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" },
			],
			dirty: false,
		});
	});

	test.each([false, true])("preserves explicit dirty=%s", (dirty) => {
		expect(FilterStateSchema.parse({ active: [], dirty })).toEqual({
			active: [],
			dirty,
		});
	});

	test.each(["ON_TIME", "DELAYED"])(
		"rejects duplicate types even when the second criteria is %s",
		(criteria) => {
			expect(
				FilterStateSchema.safeParse({
					active: [
						{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria: "ON_TIME" },
						{ type: "SHIPMENT:DELIVERY_PREDICTION", criteria },
					],
				}).success,
			).toBe(false);
		},
	);

	test.each([
		null,
		{},
		{ active: null },
		{ active: {} },
		{ active: [{ type: "UNKNOWN", criteria: true }] },
		{ active: [], dirty: null },
		{ active: [], dirty: "false" },
		{ active: [], dirty: 0 },
	])("rejects invalid state %j", (input) => {
		expect(FilterStateSchema.safeParse(input).success).toBe(false);
	});

	test("starts with no active filters and a clean flag", () => {
		expect(FilterStateSchema.parse(initialFiltersState)).toEqual({
			active: [],
			dirty: false,
		});
	});
});
