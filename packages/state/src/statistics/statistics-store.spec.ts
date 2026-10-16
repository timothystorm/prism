import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "../app-state";
import type { Statistic } from "./statistics-schema";
import { StatisticsStore } from "./statistics-store";

function createStatisticsStore(
	statistics: AppState["statistics"] = {
		activeStatistic: null,
		selectedStatistics: [],
	},
) {
	const store = createStore<AppState>(() => ({
		...initialAppState,
		statistics,
	}));

	const actions = new StatisticsStore(store.getState, store.setState);
	return { store, actions };
}

describe("StatisticsStore", () => {
	describe("validation", () => {
		test.each([
			{
				property: "state",
				value: {
					activeStatistic: "unknown",
					selectedStatistics: [],
				},
			},
			{
				property: "state",
				value: {
					activeStatistic: null,
					selectedStatistics: ["unknown"],
				},
			},
			{ property: "activeStatistic", value: "unknown" },
			{
				property: "selectedStatistics",
				value: ["exceptions", "unknown"],
			},
			{ property: "selectedStatistics", value: null },
		])(
			"rejects invalid $property input without changing state or notifying subscribers ($value)",
			({ property, value }) => {
				const { store, actions } = createStatisticsStore();
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
		test("returns the current statistics state", () => {
			const { store, actions } = createStatisticsStore();

			expect(actions.state).toBe(store.getState().statistics);
		});

		test("replaces the statistics state without changing earlier snapshots or the input", () => {
			const { store, actions } = createStatisticsStore({
				activeStatistic: "exceptions",
				selectedStatistics: ["custom:one"],
			});
			const initial = store.getState();
			const nextState: AppState["statistics"] = {
				activeStatistic: "label_created",
				selectedStatistics: ["custom:two"],
			};

			actions.state = nextState;

			expect(actions.state).toEqual(nextState);
			expect(store.getState().statistics).toEqual(nextState);
			expect(initial.statistics).toEqual({
				activeStatistic: "exceptions",
				selectedStatistics: ["custom:one"],
			});
			expect(nextState).toEqual({
				activeStatistic: "label_created",
				selectedStatistics: ["custom:two"],
			});
		});
	});

	describe("active statistic", () => {
		test("returns null when the active statistic is omitted", () => {
			const { actions } = createStatisticsStore({ selectedStatistics: [] });
			expect(actions.activeStatistic).toBeNull();
			expect(actions.selectedStatistics).toEqual([]);
		});

		test.each<Statistic>(["exceptions", "label_created", "custom:one"])(
			"sets %s as active without changing earlier snapshots or other fields",
			(statistic) => {
				const { store, actions } = createStatisticsStore({
					activeStatistic: null,
					selectedStatistics: ["custom:two"],
				});
				const initial = store.getState();

				actions.activeStatistic = statistic;

				expect(actions.activeStatistic).toBe(statistic);
				expect(store.getState().statistics).toEqual({
					activeStatistic: statistic,
					selectedStatistics: ["custom:two"],
				});
				expect(initial.statistics.activeStatistic).toBeNull();
			},
		);

		test("clears the active statistic by assigning null", () => {
			const { store, actions } = createStatisticsStore();
			actions.activeStatistic = "exceptions";
			const selected = store.getState();

			actions.activeStatistic = null;

			expect(actions.activeStatistic).toBeNull();
			expect(selected.statistics.activeStatistic).toBe("exceptions");
		});
	});

	describe("selected statistics", () => {
		test("replaces selections with unique statistics in first-occurrence order", () => {
			const { store, actions } = createStatisticsStore();
			actions.activeStatistic = "label_created";
			actions.selectedStatistics = ["label_created"];
			const initial = store.getState();
			const input: Statistic[] = [
				"custom:one",
				"exceptions",
				"custom:one",
				"exceptions",
			];

			actions.selectedStatistics = input;

			expect(store.getState().statistics).toEqual({
				activeStatistic: "label_created",
				selectedStatistics: ["custom:one", "exceptions"],
			});
			expect(initial.statistics.selectedStatistics).toEqual(["label_created"]);
			expect(input).toEqual([
				"custom:one",
				"exceptions",
				"custom:one",
				"exceptions",
			]);
			expect(actions.selectedStatistics).not.toBe(input);
		});

		test("clears selected statistics by assigning an empty array", () => {
			const { actions } = createStatisticsStore();
			actions.selectedStatistics = ["exceptions"];

			actions.selectedStatistics = [];

			expect(actions.selectedStatistics).toEqual([]);
		});

		test("notifies subscribers with the updated state when selections are assigned", () => {
			const { store, actions } = createStatisticsStore();
			const updates: AppState[] = [];
			store.subscribe((state) => {
				updates.push(state);
			});

			actions.selectedStatistics = ["exceptions"];

			expect(updates).toEqual([
				{
					...initialAppState,
					statistics: {
						activeStatistic: null,
						selectedStatistics: ["exceptions"],
					},
				},
			]);
		});
	});
});
