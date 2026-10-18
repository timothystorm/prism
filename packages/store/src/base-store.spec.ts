import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "./app-state";
import { BaseStore } from "./base-store";
import { StatusesStateSchema } from "./statuses/statuses-state";

class TestStatusesStore extends BaseStore<"statuses"> {
	protected readonly sliceKey = "statuses";
	protected readonly stateSchema = StatusesStateSchema;
}

function createTestStore() {
	const store = createStore<AppState>(() => ({ ...initialAppState }));
	const actions = new TestStatusesStore(store.getState, store.setState);
	return { store, actions };
}

describe("BaseStore", () => {
	test("replaces only its slice, validates input, and preserves earlier snapshots", () => {
		const { store, actions } = createTestStore();
		const initial = store.getState();
		const input = { activeStatuses: ["LABEL_CREATED"] as const, dirty: true };
		const updates: AppState[] = [];
		store.subscribe((state) => updates.push(state));

		actions.setState({
			activeStatuses: [...input.activeStatuses],
			dirty: input.dirty,
		});

		expect(actions.getState()).toBe(store.getState().statuses);
		expect(actions.getState()).toEqual({
			activeStatuses: ["LABEL_CREATED"],
			dirty: true,
		});
		expect(initial.statuses).toEqual({ activeStatuses: [], dirty: false });
		expect(store.getState().columns).toBe(initial.columns);
		expect(store.getState().metrics).toBe(initial.metrics);
		expect(store.getState().filters).toBe(initial.filters);
		expect(updates).toHaveLength(1);
	});

	test("stores parsed slice values without retaining caller-owned arrays", () => {
		const { actions } = createTestStore();
		const input: AppState["statuses"] = {
			activeStatuses: ["LABEL_CREATED"],
			dirty: false,
		};

		actions.setState(input);
		input.activeStatuses.push("DELIVERED");

		expect(actions.getState().activeStatuses).toEqual(["LABEL_CREATED"]);
		expect(actions.getState().dirty).toBe(false);
	});

	test.each([
		{ activeStatuses: ["UNKNOWN"], dirty: true },
		{ activeStatuses: [], dirty: "true" },
	])("rejects invalid slice replacement without notifications: %j", (input) => {
		const { store, actions } = createTestStore();
		const initial = store.getState();
		let notifications = 0;
		store.subscribe(() => {
			notifications += 1;
		});

		expect(() => Reflect.apply(actions.setState, actions, [input])).toThrow(
			ZodError,
		);

		expect(store.getState()).toBe(initial);
		expect(notifications).toBe(0);
	});
});
