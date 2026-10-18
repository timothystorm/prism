import { describe, expect, test } from "vitest";
import { initialViewsState, ViewsStateSchema } from "./views-state";

describe("ViewsStateSchema", () => {
	test("starts with the built-in view active and a clean state", () => {
		expect(initialViewsState).toEqual({
			activeView: "default",
			dirty: false,
		});
		expect(ViewsStateSchema.parse(initialViewsState)).toEqual(
			initialViewsState,
		);
	});

	test("accepts an active view identifier and defaults dirty to false", () => {
		const input = { activeView: "view-1" };
		expect(ViewsStateSchema.parse(input)).toEqual({ ...input, dirty: false });
	});

	test("preserves the supplied active view and dirty flag", () => {
		const input = { activeView: "view-1", dirty: true };
		expect(ViewsStateSchema.parse(input)).toEqual(input);
	});

	test.each([
		{ activeView: { id: "default", name: "Default" } },
		{ activeView: "" },
		{ activeView: null },
		{ activeView: undefined },
		{ activeView: 1 },
		{ dirty: "true" },
	])("rejects invalid state: %j", (changes) => {
		expect(
			ViewsStateSchema.safeParse({ ...initialViewsState, ...changes }).success,
		).toBe(false);
	});
});
