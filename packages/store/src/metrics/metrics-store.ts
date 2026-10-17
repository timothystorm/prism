import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import type { MetricType } from "./metrics-schema";
import { MetricsStateSchema } from "./metrics-state";

/**
 * A class that provides actions to manipulate the metrics state in the application.
 *
 * This should only manage state and not contain any business logic. It is designed to be used with a state management
 * library like Zustand but should not be tied to any specific implementation - no Zustand types should be used here.
 */
export class MetricsStore extends BaseStore<"metrics"> {
	protected readonly sliceKey = "metrics";
	protected readonly stateSchema = MetricsStateSchema;

	/**
	 * @return The currently focused metric, or null if none is focused.
	 */
	get focusedMetric(): MetricType | null {
		return this.state?.focusedMetric ?? null;
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
		return this.state?.trackedMetrics ?? [];
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
				state.metrics.trackedMetrics = validated;
			}),
		);
	}
}
