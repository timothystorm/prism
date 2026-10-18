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
		expect(actions.getState()).toEqual(initialViewsState);
		expect(actions.getActiveView()).toBe("default");
	});

	test.each([false, true])(
		"updates the active view immutably while preserving dirty=%s",
		(dirty) => {
			const { store, actions } = createViewsStore();
			actions.setState({ ...initialViewsState, dirty });
			const initial = store.getState();
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			actions.setActiveView("view-1");

			expect(actions.getState()).toEqual({
				activeView: "view-1",
				dirty,
			});
			expect(actions.getActiveView()).toBe("view-1");
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
			expect(updates).toHaveLength(1);

			actions.setActiveView("default");
			expect(actions.getState()).toEqual({ ...initialViewsState, dirty });
		},
	);

	test.each([
		{ property: "setActiveView", value: "" },
		{ property: "setActiveView", value: null },
		{ property: "setActiveView", value: 1 },
		{ property: "setState", value: { ...initialViewsState, activeView: "" } },
		{ property: "setState", value: { ...initialViewsState, dirty: "true" } },
	] as const)(
		"rejects invalid $property without updating or notifying",
		({ property, value }) => {
			const { store, actions } = createViewsStore();
			actions.setState({
				activeView: "view-1",
				dirty: true,
			});
			const initial = store.getState();
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			expect(() => Reflect.apply(actions[property], actions, [value])).toThrow(
				ZodError,
			);
			expect(store.getState()).toBe(initial);
			expect(updates).toHaveLength(0);
		},
	);

	test("replaces the active view and dirty flag without retaining caller references", () => {
		const { actions } = createViewsStore();
		const input = {
			activeView: "view-1",
			dirty: true,
		};
		actions.setState(input);
		input.activeView = "Caller mutation";
		expect(actions.getState()).toEqual({ activeView: "view-1", dirty: true });

		actions.setState(initialViewsState);
		expect(actions.getState()).toEqual(initialViewsState);
	});
});
