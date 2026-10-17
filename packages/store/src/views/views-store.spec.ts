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
		expect(actions.created).toEqual([]);
		expect(actions.current).toBe("default");
		expect(actions.default).toBe("default");
	});

	test.each([false, true])(
		"updates metadata and selections immutably while preserving dirty=%s",
		(dirty) => {
			const { store, actions } = createViewsStore();
			actions.state = { ...initialViewsState, dirty };
			const initial = store.getState();
			const view = { id: "view-1", name: "My view" };
			const created = [view];
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			actions.created = created;
			view.name = "Caller mutation";
			created.push({ id: "view-2", name: "Another view" });
			actions.current = "view-1";
			actions.default = "view-1";

			expect(actions.state).toEqual({
				created: [{ id: "view-1", name: "My view" }],
				current: "view-1",
				default: "view-1",
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
			expect(updates).toHaveLength(3);

			actions.current = "default";
			actions.default = "default";
			actions.created = [];
			expect(actions.state).toEqual({ ...initialViewsState, dirty });
		},
	);

	test.each([
		{ property: "current", value: "missing" },
		{ property: "default", value: "missing" },
		{ property: "created", value: [] },
		{ property: "created", value: [{ id: "view-2", name: "Other" }] },
		{ property: "created", value: [{ id: "view-1", name: "" }] },
		{ property: "state", value: { ...initialViewsState, current: "missing" } },
		{ property: "state", value: { ...initialViewsState, dirty: "true" } },
	])(
		"rejects invalid $property without updating or notifying",
		({ property, value }) => {
			const { store, actions } = createViewsStore();
			actions.state = {
				created: [{ id: "view-1", name: "My view" }],
				current: "view-1",
				default: "view-1",
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

	test("atomically replaces views and selections without retaining caller references", () => {
		const { actions } = createViewsStore();
		const view = { id: "view-1", name: "My view" };
		const input = {
			created: [view],
			current: "view-1",
			default: "view-1",
			dirty: true,
		};
		actions.state = input;
		view.name = "Caller mutation";
		expect(actions.created[0]?.name).toBe("My view");

		actions.state = initialViewsState;
		expect(actions.state).toEqual(initialViewsState);
	});
});
