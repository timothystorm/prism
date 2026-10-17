import { describe, expect, test } from "vitest";
import {
	LocationAttributeTypeSchema,
	LocationCriterionSchema,
} from "./location-schema";

describe("LocationCriterionSchema", () => {
	test.each([
		{ type: "ADDRESS", value: "123 Main St" },
		{ type: "CITY", value: "Chicago" },
		{ type: "STATE_OR_PROVINCE", value: "IL" },
		{ type: "COUNTRY_OR_TERRITORY", value: "US" },
		{ type: "POSTAL_CODE", value: "00601" },
	])("preserves $type criteria as strings", (criterion) => {
		expect(LocationAttributeTypeSchema.parse(criterion.type)).toBe(
			criterion.type,
		);
		expect(LocationCriterionSchema.parse(criterion)).toEqual(criterion);
	});

	test.each([
		null,
		{},
		{ type: "UNKNOWN", value: "Chicago" },
		{ type: "city", value: "Chicago" },
		{ type: "CITY" },
		{ type: "CITY", value: null },
		{ type: "POSTAL_CODE", value: 601 },
	])("rejects invalid location criteria %j", (criterion) => {
		expect(LocationCriterionSchema.safeParse(criterion).success).toBe(false);
	});
});
