import { produce } from "immer";
import type { AppState } from "../app-state";
import type { Statistic } from "./statistics-schema";
import {
	type StatisticsState,
	StatisticsStateSchema,
} from "./statistics-state";

/**
 * A class that provides actions to manipulate the statistics state in the application.
 *
 * This should only manage state and not contain any business logic. It is designed to be used with a state management
 * library like Zustand but should not be tied to any specific implementation - no Zustand types should be used here.
 */
export class StatisticsStore {
	/**
	 * Creates an instance of StatisticsStore.
	 *
	 * @param getState A function that returns the current application state.
	 * @param setState A function that updates the application state based on a provided updater function.
	 */
	constructor(
		private readonly getState: () => AppState,
		private readonly setState: (
			updater: (state: AppState) => Partial<AppState>,
		) => void,
	) {}

	/**
	 * Sets the statistics state in the application. Use this method to update the statistics state with a new state
	 * object. Be cautious when using this method, as it will replace the entire statistics state with the provided state.
	 *
	 * @param state The new statistics state to set.
	 * @throws ZodError If the state is invalid. The state remains unchanged.
	 */
	set state(state: StatisticsState) {
		const validated = StatisticsStateSchema.parse(state);
		this.setState(
			produce<AppState>((appState) => {
				appState.statistics = validated;
			}),
		);
	}

	/**
	 * Gets the current statistics state from the application. Use this method to retrieve the current state of statistics.
	 *
	 * @return The current statistics state.
	 */
	get state(): StatisticsState {
		return this.getState().statistics;
	}

	/**
	 * @return The currently active statistic, or null if none is active.
	 */
	get activeStatistic(): Statistic | null {
		return this.getState().statistics?.activeStatistic ?? null;
	}

	/**
	 * Sets the currently active statistic. If the input is null, it clears the active statistic.
	 *
	 * @param statistic The statistic to set as active, or null to clear the active statistic.
	 * @throws ZodError If the statistic is invalid. The state remains unchanged.
	 */
	set activeStatistic(statistic: Statistic | null) {
		const validated =
			StatisticsStateSchema.shape.activeStatistic.parse(statistic);
		this.setState(
			produce<AppState>((state) => {
				state.statistics.activeStatistic = validated;
			}),
		);
	}

	/**
	 * Sets the currently selected statistics.
	 *
	 * @param statistics The statistics to set as selected.
	 * @throws ZodError If the selections are invalid. The state remains unchanged.
	 */
	set selectedStatistics(statistics: Statistic[]) {
		const validated =
			StatisticsStateSchema.shape.selectedStatistics.parse(statistics);
		this.setState(
			produce<AppState>((state) => {
				state.statistics.selectedStatistics = [...new Set(validated)];
			}),
		);
	}

	/**
	 * @return The currently selected statistics, or an empty array if none are selected.
	 */
	get selectedStatistics(): Statistic[] {
		return this.getState().statistics?.selectedStatistics;
	}
}
