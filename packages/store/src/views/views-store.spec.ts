import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "../app-state";
import { initialViewsState } from "./views-state";
import { ViewsStore } from "./views-store";

function createViewsStore() {
	const store = createStore<AppState>(() => ({ ...initialAppState }));
	const actions = new ViewsStore(store.getState, store.setState);
	return { store, actions };
}

describe("ViewsStore", () => {
	test("exposes the initial views state", () => {
		const { actions } = createViewsStore();
		expect(actions.state).toEqual(initialViewsState);
		expect(actions.custom).toEqual([]);
		expect(actions.current).toBe("default");
	});

	test.each([false, true])(
		"updates metadata and selection immutably while preserving dirty=%s",
		(dirty) => {
			const { store, actions } = createViewsStore();
			actions.state = { ...initialViewsState, dirty };
			const initial = store.getState();
			const view = { id: "view-1", name: "My view" };
			const custom = [view];
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			actions.custom = custom;
			view.name = "Caller mutation";
			custom.push({ id: "view-2", name: "Another view" });
			actions.current = "view-1";

			expect(actions.state).toEqual({
				custom: [{ id: "view-1", name: "My view" }],
				current: "view-1",
				dirty,
			});
			expect(initial.views).toEqual({ ...initialViewsState, dirty });
			for (const key of [
				"account",
				"metrics",
				"columns",
				"statuses",
				"filters",
			] as const) {
				expect(store.getState()[key]).toBe(initial[key]);
			}
			expect(updates).toHaveLength(2);

			actions.current = "default";
			actions.custom = [];
			expect(actions.state).toEqual({ ...initialViewsState, dirty });
		},
	);

	test.each([false, true])(
		"allows selection outside custom views and independent list replacement while preserving dirty=%s",
		(dirty) => {
			const { actions } = createViewsStore();
			actions.state = { ...initialViewsState, dirty };

			actions.current = "view-1";
			actions.custom = [
				{ id: "default", name: "My default" },
				{ id: "view-1", name: "My view" },
			];
			actions.custom = [{ id: "view-2", name: "Other" }];

			expect(actions.state).toEqual({
				custom: [{ id: "view-2", name: "Other" }],
				current: "view-1",
				dirty,
			});

			actions.custom = [];
			expect(actions.state).toEqual({
				custom: [],
				current: "view-1",
				dirty,
			});
		},
	);

	test.each([
		{ property: "current", value: "" },
		{ property: "current", value: null },
		{ property: "custom", value: null },
		{ property: "custom", value: [{ id: "", name: "My view" }] },
		{ property: "custom", value: [{ id: "view-1", name: "" }] },
		{
			property: "custom",
			value: [
				{ id: "view-1", name: "First" },
				{ id: "view-1", name: "Second" },
			],
		},
		{ property: "state", value: { ...initialViewsState, current: "" } },
		{ property: "state", value: { ...initialViewsState, dirty: "true" } },
	])(
		"rejects invalid $property without updating or notifying",
		({ property, value }) => {
			const { store, actions } = createViewsStore();
			actions.state = {
				custom: [{ id: "view-1", name: "My view" }],
				current: "view-1",
				dirty: true,
			};
			const initial = store.getState();
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			expect(() => Reflect.set(actions, property, value)).toThrow(ZodError);
			expect(store.getState()).toBe(initial);
			expect(updates).toHaveLength(0);
		},
	);

	test("atomically replaces custom views and selection without retaining caller references", () => {
		const { actions } = createViewsStore();
		const view = { id: "view-1", name: "My view" };
		actions.state = {
			custom: [view],
			current: "view-1",
			dirty: true,
		};
		view.name = "Caller mutation";
		expect(actions.custom[0]?.name).toBe("My view");

		actions.state = initialViewsState;
		expect(actions.state).toEqual(initialViewsState);
	});
});
