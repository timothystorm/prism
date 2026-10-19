import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import type { MetricType } from "./metrics-schema";
import { MetricsStateSchema } from "./metrics-state";

/**
 * Provides validated, immutable access to the active metric and metrics selected for display in the current view.
 * The two selections are independent: selecting metrics for display does not activate them.
 * Controllers manage business workflows and dirty flags.
 */
export class MetricsStore extends BaseStore<"metrics"> {
  protected readonly sliceKey = "metrics";
  protected readonly stateSchema = MetricsStateSchema;

  /**
   * @return The currently active metric, or null if none is active.
   */
  getActiveMetric(): MetricType | null {
    return this.getState().activeMetric;
  }

  /**
   * Sets the currently active metric. If the input is null, it clears the activation.
   * Preserves the dirty flag; controllers manage it through setState().
   *
   * @param metric The metric to activate, or null to clear the activation.
   * @throws ZodError If the metric is invalid. The state remains unchanged.
   */
  setActiveMetric(metric: MetricType | null): void {
    const validated = MetricsStateSchema.shape.activeMetric.parse(metric);
    this.setAppState(
      produce<AppState>((state) => {
        state.metrics.activeMetric = validated;
      }),
    );
  }

  /**
   * @return The metrics selected for display in this view, in display order, or an empty array if none are selected.
   */
  getSelectedMetrics(): MetricType[] {
    return this.getState().selectedMetrics;
  }

  /**
   * Replaces the metrics selected for display in this view, preserving the supplied order.
   * An empty array clears the selection.
   * Preserves the dirty flag; controllers manage it through setState().
   *
   * @param metrics Unique metric identifiers selected for display, in order.
   * @throws ZodError If the selections are invalid. The state remains unchanged.
   */
  setSelectedMetrics(metrics: MetricType[]): void {
    const validated = MetricsStateSchema.shape.selectedMetrics.parse(metrics);
    this.setAppState(
      produce<AppState>((state) => {
        state.metrics.selectedMetrics = validated;
      }),
    );
  }
}
