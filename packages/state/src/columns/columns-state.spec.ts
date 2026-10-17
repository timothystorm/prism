import { describe, expect, test } from "vitest";
import { ColumnsStateSchema, initialColumnsState } from "./columns-state";

describe("ColumnsStateSchema", () => {
	test("accepts a state with only the required column", () => {
		expect(
			ColumnsStateSchema.parse({ selectedColumns: [{ name: "TRACKING_ID" }] }),
		).toEqual({ selectedColumns: [{ name: "TRACKING_ID" }] });
	});

	test.each([
		{},
		{ selectedColumns: null },
		{ selectedColumns: [] },
		{ selectedColumns: [{ name: "STATUS" }] },
		{ selectedColumns: [{ name: "TRACKING_ID" }, { name: "TRACKING_ID" }] },
		{ selectedColumns: [{ name: "TRACKING_ID", sortDirection: "invalid" }] },
	])("rejects a missing or invalid selection: %j", (state) => {
		expect(ColumnsStateSchema.safeParse(state).success).toBe(false);
	});

	test("accepts the initial columns state", () => {
		expect(ColumnsStateSchema.parse(initialColumnsState)).toEqual(
			initialColumnsState,
		);
	});
});
