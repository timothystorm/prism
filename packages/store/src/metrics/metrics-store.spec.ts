import type { MetricType } from "@fedex/prism-contracts";
import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "../app-state";
import { MetricsStore } from "./metrics-store";

function createMetricsStore(
  metrics: AppState["metrics"] = {
    activeMetric: null,
    selectedMetrics: [],
    dirty: false,
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
    test.each(["setState", "setSelectedMetrics"] as const)(
      "rejects duplicate metrics through %s without changing state, input, or notifying subscribers",
      (property) => {
        for (const input of [
          ["EXCEPTION", "EXCEPTION"],
          ["CUSTOM:ONE", "LABEL_CREATED", "CUSTOM:ONE"],
        ]) {
          const { store, actions } = createMetricsStore({
            activeMetric: "LABEL_CREATED",
            selectedMetrics: ["LABEL_CREATED"],
            dirty: false,
          });
          const initial = store.getState();
          const originalInput = [...input];
          let notifications = 0;
          store.subscribe(() => {
            notifications += 1;
          });
          const value =
            property === "setState" ? { activeMetric: "EXCEPTION", selectedMetrics: input } : input;

          expect(() => Reflect.apply(actions[property], actions, [value])).toThrow(ZodError);

          expect(store.getState()).toBe(initial);
          expect(actions.getActiveMetric()).toBe("LABEL_CREATED");
          expect(actions.getSelectedMetrics()).toEqual(["LABEL_CREATED"]);
          expect(input).toEqual(originalInput);
          expect(notifications).toBe(0);
        }
      },
    );

    test.each([
      {
        property: "setState",
        value: {
          activeMetric: "unknown",
          selectedMetrics: [],
        },
      },
      {
        property: "setState",
        value: {
          activeMetric: null,
          selectedMetrics: ["unknown"],
        },
      },
      { property: "setActiveMetric", value: "unknown" },
      {
        property: "setSelectedMetrics",
        value: ["EXCEPTION", "unknown"],
      },
      { property: "setSelectedMetrics", value: null },
    ] as const)(
      "rejects invalid $property input without changing state or notifying subscribers ($value)",
      ({ property, value }) => {
        const { store, actions } = createMetricsStore();
        const initial = store.getState();
        let notifications = 0;
        store.subscribe(() => {
          notifications += 1;
        });

        expect(() => Reflect.apply(actions[property], actions, [value])).toThrow(ZodError);

        expect(store.getState()).toBe(initial);
        expect(notifications).toBe(0);
      },
    );
  });

  describe("getState/setState", () => {
    test.each([false, true])(
      "preserves controller-managed dirty=%s when changing or clearing metrics",
      (dirty) => {
        const { actions } = createMetricsStore();
        actions.setState({ ...actions.getState(), dirty });

        actions.setActiveMetric("EXCEPTION");
        expect(actions.getState().dirty).toBe(dirty);
        actions.setSelectedMetrics(["EXCEPTION"]);
        expect(actions.getState()).toEqual({
          activeMetric: "EXCEPTION",
          selectedMetrics: ["EXCEPTION"],
          dirty,
        });

        actions.setActiveMetric(null);
        expect(actions.getState().dirty).toBe(dirty);
        actions.setSelectedMetrics([]);
        expect(actions.getState()).toEqual({
          activeMetric: null,
          selectedMetrics: [],
          dirty,
        });
      },
    );

    test("allows the controller to toggle dirty without changing metric selections", () => {
      const { store, actions } = createMetricsStore();
      const initial = store.getState();
      const updates: AppState[] = [];
      store.subscribe((state) => updates.push(state));

      actions.setState({ ...actions.getState(), dirty: true });
      actions.setState({ ...actions.getState(), dirty: false });

      expect(updates.map((state) => state.metrics)).toEqual([
        { activeMetric: null, selectedMetrics: [], dirty: true },
        { activeMetric: null, selectedMetrics: [], dirty: false },
      ]);
      expect(initial.metrics.dirty).toBe(false);
    });

    test.each([null, "true", 1])(
      "rejects invalid dirty=%j without updating or notifying",
      (dirty) => {
        const { store, actions } = createMetricsStore();
        const initial = store.getState();
        const updates: AppState[] = [];
        store.subscribe((state) => updates.push(state));

        expect(() =>
          Reflect.apply(actions.setState, actions, [{ ...actions.getState(), dirty }]),
        ).toThrow(ZodError);
        expect(store.getState()).toBe(initial);
        expect(updates).toHaveLength(0);
      },
    );

    test("returns the current metrics state", () => {
      const { store, actions } = createMetricsStore();

      expect(actions.getState()).toBe(store.getState().metrics);
    });

    test("replaces the metrics state without changing earlier snapshots or the input", () => {
      const { store, actions } = createMetricsStore({
        activeMetric: "EXCEPTION",
        selectedMetrics: ["CUSTOM:ONE"],
        dirty: false,
      });
      const initial = store.getState();
      const nextState: AppState["metrics"] = {
        activeMetric: "LABEL_CREATED",
        selectedMetrics: ["CUSTOM:TWO"],
        dirty: true,
      };

      actions.setState(nextState);

      expect(actions.getState()).toEqual(nextState);
      expect(store.getState().metrics).toEqual(nextState);
      expect(initial.metrics).toEqual({
        activeMetric: "EXCEPTION",
        selectedMetrics: ["CUSTOM:ONE"],
        dirty: false,
      });
      expect(nextState).toEqual({
        activeMetric: "LABEL_CREATED",
        selectedMetrics: ["CUSTOM:TWO"],
        dirty: true,
      });
    });
  });

  describe("active metric", () => {
    test.each([
      { selectedMetrics: [], dirty: true },
      { activeMetric: undefined, selectedMetrics: [], dirty: true },
    ])("stores null when the active metric is omitted: %j", (metrics) => {
      const { store, actions } = createMetricsStore({
        activeMetric: "EXCEPTION",
        selectedMetrics: ["EXCEPTION"],
        dirty: true,
      });
      const updates: AppState[] = [];
      store.subscribe((state) => updates.push(state));

      Reflect.apply(actions.setState, actions, [metrics]);

      expect(store.getState().metrics).toEqual({
        activeMetric: null,
        selectedMetrics: [],
        dirty: true,
      });
      expect(actions.getActiveMetric()).toBeNull();
      expect(actions.getSelectedMetrics()).toEqual([]);
      expect(updates).toHaveLength(1);
      expect(updates[0]?.metrics.activeMetric).toBeNull();
    });

    test.each<MetricType>(["EXCEPTION", "LABEL_CREATED", "CUSTOM:ONE"])(
      "sets %s as active without changing earlier snapshots or other fields",
      (metrics) => {
        const { store, actions } = createMetricsStore({
          activeMetric: null,
          selectedMetrics: ["CUSTOM:TWO"],
          dirty: false,
        });
        const initial = store.getState();

        actions.setActiveMetric(metrics);

        expect(actions.getActiveMetric()).toBe(metrics);
        expect(store.getState().metrics).toEqual({
          activeMetric: metrics,
          selectedMetrics: ["CUSTOM:TWO"],
          dirty: false,
        });
        expect(initial.metrics.activeMetric).toBeNull();
        expect(store.getState().metrics.selectedMetrics).toBe(initial.metrics.selectedMetrics);
      },
    );

    test("clears the active metric by passing null to setActiveMetric", () => {
      const { store, actions } = createMetricsStore();
      actions.setActiveMetric("EXCEPTION");
      const selected = store.getState();

      actions.setActiveMetric(null);

      expect(actions.getActiveMetric()).toBeNull();
      expect(selected.metrics.activeMetric).toBe("EXCEPTION");
    });

    test("does not notify or replace state when focus is unchanged", () => {
      const { store, actions } = createMetricsStore();
      const initial = store.getState();
      let notifications = 0;
      store.subscribe(() => {
        notifications += 1;
      });

      actions.setActiveMetric(null);

      expect(store.getState()).toBe(initial);
      expect(notifications).toBe(0);
    });
  });

  describe("selected metrics", () => {
    test("replaces selections with unique metrics in the supplied order", () => {
      const { store, actions } = createMetricsStore();
      actions.setActiveMetric("LABEL_CREATED");
      actions.setSelectedMetrics(["LABEL_CREATED"]);
      const initial = store.getState();
      const input: MetricType[] = ["CUSTOM:ONE", "EXCEPTION", "CUSTOM:TWO"];

      actions.setSelectedMetrics(input);

      expect(store.getState().metrics).toEqual({
        activeMetric: "LABEL_CREATED",
        selectedMetrics: ["CUSTOM:ONE", "EXCEPTION", "CUSTOM:TWO"],
        dirty: false,
      });
      expect(initial.metrics.selectedMetrics).toEqual(["LABEL_CREATED"]);
      expect(input).toEqual(["CUSTOM:ONE", "EXCEPTION", "CUSTOM:TWO"]);
      expect(actions.getSelectedMetrics()).not.toBe(input);
    });

    test("clears selected metrics by passing an empty array to setSelectedMetrics", () => {
      const { actions } = createMetricsStore();
      actions.setSelectedMetrics(["EXCEPTION"]);

      actions.setSelectedMetrics([]);

      expect(actions.getSelectedMetrics()).toEqual([]);
    });

    test("notifies subscribers with the updated state when setSelectedMetrics is called", () => {
      const { store, actions } = createMetricsStore();
      const updates: AppState[] = [];
      store.subscribe((state) => {
        updates.push(state);
      });

      actions.setSelectedMetrics(["EXCEPTION"]);

      expect(updates).toEqual([
        {
          ...initialAppState,
          metrics: {
            activeMetric: null,
            selectedMetrics: ["EXCEPTION"],
            dirty: false,
          },
        },
      ]);
    });
  });
});
