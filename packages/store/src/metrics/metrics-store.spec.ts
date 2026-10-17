import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "../app-state";
import type { MetricType } from "./metrics-schema";
import { MetricsStore } from "./metrics-store";

function createMetricsStore(
	metrics: AppState["metrics"] = {
		focusedMetric: null,
		trackedMetrics: [],
	},
) {
	const store = createStore<AppState>(() => ({
		...initialAppState,
		metrics,
	}));

	const actions = new MetricsStore(store.getState, store.setState);
	return { store, actions };
}

describe("MetricsStore", () => {
	describe("validation", () => {
		test.each(["state", "trackedMetrics"] as const)(
			"rejects duplicate metrics through %s without changing state, input, or notifying subscribers",
			(property) => {
				for (const input of [
					["EXCEPTION", "EXCEPTION"],
					["CUSTOM:ONE", "LABEL_CREATED", "CUSTOM:ONE"],
				]) {
					const { store, actions } = createMetricsStore({
						focusedMetric: "LABEL_CREATED",
						trackedMetrics: ["LABEL_CREATED"],
					});
					const initial = store.getState();
					const originalInput = [...input];
					let notifications = 0;
					store.subscribe(() => {
						notifications += 1;
					});
					const value =
						property === "state"
							? { focusedMetric: "EXCEPTION", trackedMetrics: input }
							: input;

					expect(() => Reflect.set(actions, property, value)).toThrow(ZodError);

					expect(store.getState()).toBe(initial);
					expect(actions.focusedMetric).toBe("LABEL_CREATED");
					expect(actions.trackedMetrics).toEqual(["LABEL_CREATED"]);
					expect(input).toEqual(originalInput);
					expect(notifications).toBe(0);
				}
			},
		);

		test.each([
			{
				property: "state",
				value: {
					focusedMetric: "unknown",
					trackedMetrics: [],
				},
			},
			{
				property: "state",
				value: {
					focusedMetric: null,
					trackedMetrics: ["unknown"],
				},
			},
			{ property: "focusedMetric", value: "unknown" },
			{
				property: "trackedMetrics",
				value: ["EXCEPTION", "unknown"],
			},
			{ property: "trackedMetrics", value: null },
		])(
			"rejects invalid $property input without changing state or notifying subscribers ($value)",
			({ property, value }) => {
				const { store, actions } = createMetricsStore();
				const initial = store.getState();
				let notifications = 0;
				store.subscribe(() => {
					notifications += 1;
				});

				expect(() => Reflect.set(actions, property, value)).toThrow(ZodError);

				expect(store.getState()).toBe(initial);
				expect(notifications).toBe(0);
			},
		);
	});

	describe("state", () => {
		test("returns the current metrics state", () => {
			const { store, actions } = createMetricsStore();

			expect(actions.state).toBe(store.getState().metrics);
		});

		test("replaces the metrics state without changing earlier snapshots or the input", () => {
			const { store, actions } = createMetricsStore({
				focusedMetric: "EXCEPTION",
				trackedMetrics: ["CUSTOM:ONE"],
			});
			const initial = store.getState();
			const nextState: AppState["metrics"] = {
				focusedMetric: "LABEL_CREATED",
				trackedMetrics: ["CUSTOM:TWO"],
			};

			actions.state = nextState;

			expect(actions.state).toEqual(nextState);
			expect(store.getState().metrics).toEqual(nextState);
			expect(initial.metrics).toEqual({
				focusedMetric: "EXCEPTION",
				trackedMetrics: ["CUSTOM:ONE"],
			});
			expect(nextState).toEqual({
				focusedMetric: "LABEL_CREATED",
				trackedMetrics: ["CUSTOM:TWO"],
			});
		});
	});

	describe("focused metric", () => {
		test("returns null when the focused metric is omitted", () => {
			const { actions } = createMetricsStore({ trackedMetrics: [] });
			expect(actions.focusedMetric).toBeNull();
			expect(actions.trackedMetrics).toEqual([]);
		});

		test.each<MetricType>(["EXCEPTION", "LABEL_CREATED", "CUSTOM:ONE"])(
			"sets %s as active without changing earlier snapshots or other fields",
			(metrics) => {
				const { store, actions } = createMetricsStore({
					focusedMetric: null,
					trackedMetrics: ["CUSTOM:TWO"],
				});
				const initial = store.getState();

				actions.focusedMetric = metrics;

				expect(actions.focusedMetric).toBe(metrics);
				expect(store.getState().metrics).toEqual({
					focusedMetric: metrics,
					trackedMetrics: ["CUSTOM:TWO"],
				});
				expect(initial.metrics.focusedMetric).toBeNull();
			},
		);

		test("clears the active metric by assigning null", () => {
			const { store, actions } = createMetricsStore();
			actions.focusedMetric = "EXCEPTION";
			const selected = store.getState();

			actions.focusedMetric = null;

			expect(actions.focusedMetric).toBeNull();
			expect(selected.metrics.focusedMetric).toBe("EXCEPTION");
		});
	});

	describe("tracked metrics", () => {
		test("replaces selections with unique metrics in the supplied order", () => {
			const { store, actions } = createMetricsStore();
			actions.focusedMetric = "LABEL_CREATED";
			actions.trackedMetrics = ["LABEL_CREATED"];
			const initial = store.getState();
			const input: MetricType[] = ["CUSTOM:ONE", "EXCEPTION", "CUSTOM:TWO"];

			actions.trackedMetrics = input;

			expect(store.getState().metrics).toEqual({
				focusedMetric: "LABEL_CREATED",
				trackedMetrics: ["CUSTOM:ONE", "EXCEPTION", "CUSTOM:TWO"],
			});
			expect(initial.metrics.trackedMetrics).toEqual(["LABEL_CREATED"]);
			expect(input).toEqual(["CUSTOM:ONE", "EXCEPTION", "CUSTOM:TWO"]);
			expect(actions.trackedMetrics).not.toBe(input);
		});

		test("clears selected metrics by assigning an empty array", () => {
			const { actions } = createMetricsStore();
			actions.trackedMetrics = ["EXCEPTION"];

			actions.trackedMetrics = [];

			expect(actions.trackedMetrics).toEqual([]);
		});

		test("notifies subscribers with the updated state when selections are assigned", () => {
			const { store, actions } = createMetricsStore();
			const updates: AppState[] = [];
			store.subscribe((state) => {
				updates.push(state);
			});

			actions.trackedMetrics = ["EXCEPTION"];

			expect(updates).toEqual([
				{
					...initialAppState,
					metrics: {
						focusedMetric: null,
						trackedMetrics: ["EXCEPTION"],
					},
				},
			]);
		});
	});
});
