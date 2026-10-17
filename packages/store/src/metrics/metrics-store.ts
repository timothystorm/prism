import { produce } from "immer";
import type { AppState } from "../app-state";
import type { MetricType } from "./metrics-schema";
import { type MetricsState, MetricsStateSchema } from "./metrics-state";

/**
 * A class that provides actions to manipulate the metrics state in the application.
 *
 * This should only manage state and not contain any business logic. It is designed to be used with a state management
 * library like Zustand but should not be tied to any specific implementation - no Zustand types should be used here.
 */
export class MetricsStore {
	/**
	 * Creates an instance of MetricsStore.
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
	 * Gets the current metrics state from the application. Use this method to retrieve the current state of metrics.
	 *
	 * @return The current metrics state.
	 */
	get state(): MetricsState {
		return this.getState().metrics;
	}

	/**
	 * Sets the metrics state in the application. Use this method to update the metrics state with a new state
	 * object. Be cautious when using this method, as it will replace the entire metrics state with the provided state.
	 *
	 * @param state The new metrics state to set.
	 * @throws ZodError If the state is invalid. The state remains unchanged.
	 */
	set state(state: MetricsState) {
		const validated = MetricsStateSchema.parse(state);
		this.setState(
			produce<AppState>((appState) => {
				appState.metrics = validated;
			}),
		);
	}

	/**
	 * @return The currently focused metric, or null if none is focused.
	 */
	get focusedMetric(): MetricType | null {
		return this.getState().metrics?.focusedMetric ?? null;
	}

	/**
	 * Sets the currently tracked metric. If the input is null, it clears the tracked metric.
	 *
	 * @param metric The metric to set as tracked, or null to clear the tracked metric.
	 * @throws ZodError If the metric is invalid. The state remains unchanged.
	 */
	set focusedMetric(metric: MetricType | null) {
		const validated = MetricsStateSchema.shape.focusedMetric.parse(metric);
		this.setState(
			produce<AppState>((state) => {
				state.metrics.focusedMetric = validated;
			}),
		);
	}

	/**
	 * @return The currently tracked metrics, or an empty array if none are tracked.
	 */
	get trackedMetrics(): MetricType[] {
		return this.getState().metrics?.trackedMetrics ?? [];
	}

	/**
	 * Sets the currently tracked metrics.
	 *
	 * @param metric The metrics to set as tracked.
	 * @throws ZodError If the selections are invalid. The state remains unchanged.
	 */
	set trackedMetrics(metric: MetricType[]) {
		const validated = MetricsStateSchema.shape.trackedMetrics.parse(metric);
		this.setState(
			produce<AppState>((state) => {
				state.metrics.trackedMetrics = [...new Set(validated)];
			}),
		);
	}
}
