import { describe, expect, test } from "vitest";
import { createStore } from "zustand/vanilla";
import type { AppState } from "../app-state";
import type { Statistic } from "./statistics-state";
import { StatisticsStore } from "./statistics-store";

function createStatisticsStore(
	statistics: AppState["statistics"] = {
		activeStatistic: null,
		selectedStatistics: [],
		loading: true,
	},
) {
	const store = createStore<AppState>(() => ({
		statistics,
	}));

	const actions = new StatisticsStore(store.getState, store.setState);
	return { store, actions };
}

describe("StatisticsStore", () => {
	describe("state", () => {
		test("returns the current statistics state", () => {
			const { store, actions } = createStatisticsStore();

			expect(actions.state).toBe(store.getState().statistics);
		});

		test("replaces the statistics state without changing earlier snapshots or the input", () => {
			const { store, actions } = createStatisticsStore({
				activeStatistic: "exceptions",
				selectedStatistics: ["custom:one"],
				loading: true,
			});
			const initial = store.getState();
			const nextState: AppState["statistics"] = {
				activeStatistic: "label_created",
				selectedStatistics: ["custom:two"],
				loading: false,
			};

			actions.state = nextState;

			expect(actions.state).toEqual(nextState);
			expect(store.getState().statistics).toEqual(nextState);
			expect(initial.statistics).toEqual({
				activeStatistic: "exceptions",
				selectedStatistics: ["custom:one"],
				loading: true,
			});
			expect(nextState).toEqual({
				activeStatistic: "label_created",
				selectedStatistics: ["custom:two"],
				loading: false,
			});
		});
	});

	describe("loading", () => {
		test.each([
			{ action: "startLoading", initialLoading: false, expectedLoading: true },
			{ action: "stopLoading", initialLoading: true, expectedLoading: false },
		] as const)(
			"$action emits a loading change without changing statistics or earlier snapshots",
			({ action, initialLoading, expectedLoading }) => {
				const { store, actions } = createStatisticsStore({
					activeStatistic: "exceptions",
					selectedStatistics: ["custom:one"],
					loading: initialLoading,
				});
				const initial = store.getState();
				const updates: AppState[] = [];
				store.subscribe((state) => updates.push(state));

				actions[action]();

				expect(actions.loading).toBe(expectedLoading);
				expect(store.getState().statistics).toEqual({
					activeStatistic: "exceptions",
					selectedStatistics: ["custom:one"],
					loading: expectedLoading,
				});
				expect(updates).toEqual([
					{
						statistics: {
							activeStatistic: "exceptions",
							selectedStatistics: ["custom:one"],
							loading: expectedLoading,
						},
					},
				]);
				expect(initial.statistics.loading).toBe(initialLoading);
			},
		);

		test.each([
			{ action: "startLoading", loading: true },
			{ action: "stopLoading", loading: false },
		] as const)(
			"$action does not notify subscribers when loading is already $loading",
			({ action, loading }) => {
				const { store, actions } = createStatisticsStore({
					selectedStatistics: [],
					loading,
				});
				const initial = store.getState();
				let notifications = 0;
				store.subscribe(() => notifications++);

				actions[action]();

				expect(actions.loading).toBe(loading);
				expect(store.getState()).toBe(initial);
				expect(notifications).toBe(0);
			},
		);

		test("emits loading toggles without changing statistics or earlier snapshots", () => {
			const { store, actions } = createStatisticsStore({
				activeStatistic: "exceptions",
				selectedStatistics: ["custom:one"],
			});
			const initial = store.getState();

			// trace the updates to the store
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			// toggle loading store
			actions.loading = true;
			expect(actions.loading).toBe(true);
			actions.loading = false;
			expect(actions.loading).toBe(false);

			// verify that the updates were emitted correctly
			expect(updates).toEqual([
				{
					statistics: {
						activeStatistic: "exceptions",
						selectedStatistics: ["custom:one"],
						loading: true,
					},
				},
				{
					statistics: {
						activeStatistic: "exceptions",
						selectedStatistics: ["custom:one"],
						loading: false,
					},
				},
			]);

			// verify that the initial snapshot was not changed
			expect(initial.statistics.loading).toBeUndefined();
		});

		test("reads omitted loading as undefined and ignores repeated loading assignments", () => {
			const { store, actions } = createStatisticsStore({
				selectedStatistics: [],
			});
			expect(actions.loading).toBeFalsy();

			// trace the updates to the store
			actions.loading = true;
			const initial = store.getState();
			let notifications = 0;
			store.subscribe(() => notifications++);

			// attempt to set loading to the same value - shouldn't trigger an emission
			actions.loading = true;

			expect(store.getState()).toBe(initial);
			expect(notifications).toBe(0);
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
					loading: true,
				});
				const initial = store.getState();

				actions.activeStatistic = statistic;

				expect(actions.activeStatistic).toBe(statistic);
				expect(store.getState().statistics).toEqual({
					activeStatistic: statistic,
					selectedStatistics: ["custom:two"],
					loading: true,
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

		test("clears the active statistic using clearActiveStatistic", () => {
			const { store, actions } = createStatisticsStore();
			actions.activeStatistic = "exceptions";
			const selected = store.getState();

			actions.clearActiveStatistic();

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
				loading: true,
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

		test("appends a new statistic without changing earlier snapshots or other fields", () => {
			const { store, actions } = createStatisticsStore();
			actions.activeStatistic = "label_created";
			actions.selectedStatistics = ["exceptions"];
			const selected = store.getState();

			actions.addSelectedStatistic("custom:one");

			expect(store.getState().statistics).toEqual({
				activeStatistic: "label_created",
				selectedStatistics: ["exceptions", "custom:one"],
				loading: true,
			});
			expect(selected.statistics.selectedStatistics).toEqual(["exceptions"]);
		});

		test("ignores duplicate additions without notifying subscribers", () => {
			const { store, actions } = createStatisticsStore();
			actions.selectedStatistics = ["exceptions", "custom:one"];
			const selected = store.getState();
			let notifications = 0;
			store.subscribe(() => {
				notifications += 1;
			});

			actions.addSelectedStatistic("exceptions");
			actions.addSelectedStatistic("custom:one");

			expect(actions.selectedStatistics).toEqual(["exceptions", "custom:one"]);
			expect(store.getState()).toBe(selected);
			expect(notifications).toBe(0);
		});

		test("removes every matching selection without changing earlier snapshots", () => {
			const { store, actions } = createStatisticsStore({
				activeStatistic: "exceptions",
				selectedStatistics: [
					"exceptions",
					"exceptions",
					"custom:one",
					"exceptions",
				],
				loading: true,
			});
			const selected = store.getState();

			actions.removeSelectedStatistic("exceptions");

			expect(store.getState().statistics).toEqual({
				activeStatistic: "exceptions",
				selectedStatistics: ["custom:one"],
				loading: true,
			});
			expect(selected.statistics.selectedStatistics).toEqual([
				"exceptions",
				"exceptions",
				"custom:one",
				"exceptions",
			]);
		});

		test("removes the final selected statistic", () => {
			const { actions } = createStatisticsStore();
			actions.selectedStatistics = ["custom:one"];

			actions.removeSelectedStatistic("custom:one");

			expect(actions.selectedStatistics).toEqual([]);
		});

		test("does not notify subscribers when removing a statistic that is not selected", () => {
			const { store, actions } = createStatisticsStore();
			const initial = store.getState();
			let notifications = 0;
			store.subscribe(() => {
				notifications += 1;
			});

			actions.removeSelectedStatistic("exceptions");

			expect(store.getState()).toBe(initial);
			expect(notifications).toBe(0);
		});

		test("notifies subscribers with the updated store when a selection is added", () => {
			const { store, actions } = createStatisticsStore();
			const updates: AppState[] = [];
			store.subscribe((state) => {
				updates.push(state);
			});

			actions.addSelectedStatistic("exceptions");

			expect(updates).toEqual([
				{
					statistics: {
						activeStatistic: null,
						selectedStatistics: ["exceptions"],
						loading: true,
					},
				},
			]);
		});
	});
});
