import { describe, expect, test } from "vitest";
import { initialViewsState, ViewsStateSchema } from "./views-state";

describe("ViewsStateSchema", () => {
	test("starts with no custom views and the built-in default selected", () => {
		expect(initialViewsState).toEqual({
			custom: [],
			current: "default",
			dirty: false,
		});
		expect(ViewsStateSchema.parse(initialViewsState)).toEqual(
			initialViewsState,
		);
	});

	test("preserves view order, permits duplicate names, and defaults dirty to false", () => {
		const input = {
			custom: [
				{ id: "view-2", name: "My view" },
				{ id: "view-1", name: "My view" },
			],
			current: "view-1",
		};
		expect(ViewsStateSchema.parse(input)).toEqual({ ...input, dirty: false });
	});

	test("accepts a custom view with the built-in identifier", () => {
		const input = {
			custom: [{ id: "default", name: "My default" }],
			current: "default",
			dirty: true,
		};
		expect(ViewsStateSchema.parse(input)).toEqual(input);
	});

	test("accepts a current identifier outside the custom views", () => {
		const input = { custom: [], current: "missing", dirty: false };
		expect(ViewsStateSchema.parse(input)).toEqual(input);
	});

	test.each([
		{ custom: null },
		{ custom: [{ id: "", name: "My view" }] },
		{ custom: [{ id: "view-1", name: "" }] },
		{
			custom: [
				{ id: "view-1", name: "First" },
				{ id: "view-1", name: "Second" },
			],
		},
		{ current: { id: "default", name: "Default" } },
		{ current: "" },
		{ current: null },
		{ dirty: "true" },
	])("rejects invalid state: %j", (changes) => {
		expect(
			ViewsStateSchema.safeParse({ ...initialViewsState, ...changes }).success,
		).toBe(false);
	});
});
