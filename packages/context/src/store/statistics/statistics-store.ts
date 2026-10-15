import {produce} from "immer";
import type {AppState} from "../app-state";
import type {Statistic, StatisticsState} from "./statistics-state";

/**
 * A class that provides actions to manipulate the statistics store in the application.
 *
 * This should only manage store and not contain any business logic. It is designed to be used with a store management
 * library like Zustand but should not be tied to any specific implementation - no Zustand types should be used here.
 */
export class StatisticsStore {
  /**
   * Creates an instance of StatisticsStore.
   *
   * @param getState A function that returns the current application store.
   * @param setState A function that updates the application store based on a provided updater function.
   */
  constructor(
      private readonly getState: () => AppState,
      private readonly setState: (updater: (state: AppState) => Partial<AppState>) => void,
  ) {
  }

  /**
   * Sets the statistics store in the application. Use this method to update the statistics store with a new store
   * object. Be cautious when using this method, as it will replace the entire statistics store with the provided store.
   *
   * @param state The new statistics store to set.
   */
  set state(state: StatisticsState) {
    this.setState(produce<AppState>((appState) => {
      appState.statistics = state;
    }));
  }

  /**
   * Gets the current statistics store from the application. Use this method to retrieve the current store of statistics.
   *
   * @return The current statistics store.
   */
  get state(): StatisticsState {
    return this.getState().statistics;
  }

  /**
   * Gets the loading store of the statistics. This indicates whether a loading operation is currently in progress.
   *
   * @return True if a loading operation is in progress, false otherwise.
   */
  get loading(): boolean {
    return !!this.getState().statistics.loading;
  }

  /**
   * Sets the loading store of the statistics. This indicates whether a loading operation is currently in progress.
   *
   * @param loading True to indicate that a loading operation is in progress, false otherwise.
   */
  set loading(loading: boolean) {
    this.setState(produce<AppState>((state) => {
      state.statistics.loading = loading;
    }));
  }

  /**
   * Sets the loading store to true, indicating that a loading operation is in progress.
   */
  startLoading(): void {
    this.loading = true;
  }

  /**
   * Sets the loading store to false, indicating that a loading operation has completed.
   */
  stopLoading(): void {
    this.loading = false;
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
   */
  set activeStatistic(statistic: Statistic | null) {
    this.setState(produce<AppState>((state) => {
      state.statistics.activeStatistic = statistic;
    }));
  }

  /**
   * Clears the currently active statistic, setting it to null.
   */
  clearActiveStatistic(): void {
    this.activeStatistic = null;
  }

  /**
   * Sets the currently selected statistics.
   *
   * @param statistics The statistics to set as selected.
   */
  set selectedStatistics(statistics: Statistic[]) {
    this.setState(produce<AppState>((state) => {
      state.statistics.selectedStatistics = [...new Set(statistics)];
    }));
  }

  /**
   * @return The currently selected statistics, or an empty array if none are selected.
   */
  get selectedStatistics(): Statistic[] {
    return this.getState().statistics?.selectedStatistics ?? [];
  }

  /**
   * Adds a statistic to the currently selected statistics.
   *
   * @param statistic The statistic to add to the selected statistics.
   */
  addSelectedStatistic(statistic: Statistic): void {
    this.setState(produce<AppState>((state) => {
      const selected = state.statistics.selectedStatistics;
      if (!selected.includes(statistic)) selected.push(statistic);
    }));
  }

  /**
   * Removes a statistic from the currently selected statistics.
   *
   * @param statistic The statistic to remove from the selected statistics.
   */
  removeSelectedStatistic(statistic: Statistic): void {
    this.setState(produce<AppState>((state) => {
      const statistics = state.statistics.selectedStatistics;
      for (let index = statistics.length - 1; index >= 0; index--) {
        if (statistics[index] === statistic) statistics.splice(index, 1);
      }
    }));
  }
}