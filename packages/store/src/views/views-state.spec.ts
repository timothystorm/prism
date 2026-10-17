import { describe, expect, test } from "vitest";
import { initialViewsState, ViewsStateSchema } from "./views-state";

describe("ViewsStateSchema", () => {
	test("starts with no created views and the built-in default selected", () => {
		expect(initialViewsState).toEqual({
			created: [],
			current: "default",
			default: "default",
			dirty: false,
		});
		expect(ViewsStateSchema.parse(initialViewsState)).toEqual(
			initialViewsState,
		);
	});

	test("preserves view order, permits duplicate names, and defaults dirty to false", () => {
		const input = {
			created: [
				{ id: "view-2", name: "My view" },
				{ id: "view-1", name: "My view" },
			],
			current: "view-1",
			default: "view-2",
		};
		expect(ViewsStateSchema.parse(input)).toEqual({ ...input, dirty: false });
	});

	test.each([
		{ created: null },
		{ created: [{ id: "", name: "My view" }] },
		{ created: [{ id: "view-1", name: "" }] },
		{ created: [{ id: "default", name: "Reserved" }] },
		{
			created: [
				{ id: "view-1", name: "First" },
				{ id: "view-1", name: "Second" },
			],
		},
		{ current: "missing" },
		{ default: "missing" },
		{ current: { id: "default", name: "Default" } },
		{ default: { id: "default", name: "Default" } },
		{ current: "" },
		{ default: null },
		{ dirty: "true" },
	])("rejects invalid state: %j", (changes) => {
		expect(
			ViewsStateSchema.safeParse({ ...initialViewsState, ...changes }).success,
		).toBe(false);
	});
});
