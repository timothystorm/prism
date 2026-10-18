import { describe, expect, test } from "vitest";
import { ViewSchema } from "./views-schema";

describe("ViewSchema", () => {
	test("stores only a view identifier and name", () => {
		expect(
			ViewSchema.parse({
				id: "view-1",
				name: "My view",
				columns: ["STATUS"],
			}),
		).toEqual({ id: "view-1", name: "My view" });
	});

	test.each([
		null,
		{},
		{ id: "", name: "My view" },
		{ id: "view-1", name: "" },
		{ id: 1, name: "My view" },
		{ id: "view-1", name: null },
	])("rejects invalid metadata: %j", (value) => {
		expect(ViewSchema.safeParse(value).success).toBe(false);
	});
});
