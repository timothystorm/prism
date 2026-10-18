import { describe, expect, test } from "vitest";
import { ColumnsStateSchema } from "../index";
import { initialColumnsState } from "./columns-state";

describe("ColumnsStateSchema", () => {
	test("defaults dirty to false when accepting a state with only the required column", () => {
		expect(
			ColumnsStateSchema.parse({ activeColumns: [{ name: "TRACKING_ID" }] }),
		).toEqual({ activeColumns: [{ name: "TRACKING_ID" }], dirty: false });
	});

	test.each([false, true])("preserves a supplied dirty=%s", (dirty) => {
		const state = { activeColumns: [{ name: "TRACKING_ID" }], dirty };
		expect(ColumnsStateSchema.parse(state)).toEqual(state);
	});

	test.each([null, "true", 1])("rejects invalid dirty=%j", (dirty) => {
		expect(
			ColumnsStateSchema.safeParse({
				activeColumns: [{ name: "TRACKING_ID" }],
				dirty,
			}).success,
		).toBe(false);
	});

	test.each([
		{},
		{ activeColumns: null },
		{ activeColumns: [] },
		{ activeColumns: [{ name: "STATUS" }] },
		{ activeColumns: [{ name: "TRACKING_ID" }, { name: "TRACKING_ID" }] },
		{ activeColumns: [{ name: "TRACKING_ID", sortDirection: "invalid" }] },
	])("rejects a missing or invalid selection: %j", (state) => {
		expect(ColumnsStateSchema.safeParse(state).success).toBe(false);
	});

	test("accepts the initial columns state", () => {
		expect(ColumnsStateSchema.parse(initialColumnsState)).toEqual(
			initialColumnsState,
		);
	});
});
