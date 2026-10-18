import { describe, expect, expectTypeOf, test } from "vitest";
import { MetricsStateSchema, type MetricType } from "../index";
import { initialMetricsState } from "./metrics-state";

describe("MetricsStateSchema", () => {
	test.each([
		{ activeMetric: null, selectedMetrics: [] },
		{ activeMetric: "EXCEPTION", selectedMetrics: ["EXCEPTION", "CUSTOM:ONE"] },
		{ activeMetric: "CUSTOM:ONE", selectedMetrics: ["CUSTOM:ONE"] },
	])("accepts valid active and selected metrics: %j", (state) => {
		expect(MetricsStateSchema.parse(state)).toEqual({ ...state, dirty: false });
	});

	test.each([
		{ selectedMetrics: [] },
		{ activeMetric: undefined, selectedMetrics: [] },
	])("normalizes a missing active metric to null: %j", (state) => {
		const parsed = MetricsStateSchema.parse(state);

		expectTypeOf(parsed.activeMetric).toEqualTypeOf<MetricType | null>();
		expect(parsed).toEqual({
			activeMetric: null,
			selectedMetrics: [],
			dirty: false,
		});
	});

	test("allows active independently of selected metrics", () => {
		const state = { activeMetric: "EXCEPTION", selectedMetrics: [] };
		expect(MetricsStateSchema.parse(state)).toEqual({ ...state, dirty: false });
	});

	test("preserves the order of unique selected metrics", () => {
		const state = {
			selectedMetrics: ["CUSTOM:ONE", "LABEL_CREATED", "EXCEPTION"],
		};
		expect(MetricsStateSchema.parse(state)).toEqual({
			...state,
			activeMetric: null,
			dirty: false,
		});
	});

	test.each([false, true])("preserves a supplied dirty=%s", (dirty) => {
		const state = {
			activeMetric: "EXCEPTION",
			selectedMetrics: ["EXCEPTION"],
			dirty,
		};
		expect(MetricsStateSchema.parse(state)).toEqual(state);
	});

	test.each([null, "true", 1])("rejects invalid dirty=%j", (dirty) => {
		expect(
			MetricsStateSchema.safeParse({ selectedMetrics: [], dirty }).success,
		).toBe(false);
	});

	test.each([
		{ selectedMetrics: ["EXCEPTION", "EXCEPTION"] },
		{ selectedMetrics: ["CUSTOM:ONE", "LABEL_CREATED", "CUSTOM:ONE"] },
	])("rejects duplicate selected metrics: %j", (state) => {
		const result = MetricsStateSchema.safeParse(state);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						code: "custom",
						path: ["selectedMetrics"],
					}),
				]),
			);
		}
	});

	test.each([
		null,
		{},
		{ activeMetric: "EXCEPTION" },
		{ activeMetric: "UNKNOWN", selectedMetrics: [] },
		{ activeMetric: 42, selectedMetrics: [] },
		{ selectedMetrics: null },
		{ selectedMetrics: "EXCEPTION" },
		{ selectedMetrics: ["EXCEPTION", "UNKNOWN"] },
		{ selectedMetrics: [{ type: "EXCEPTION", value: 42 }] },
	])("rejects invalid metrics state: %j", (state) => {
		expect(MetricsStateSchema.safeParse(state).success).toBe(false);
	});

	test("starts with no active and no selected metrics", () => {
		expect(MetricsStateSchema.parse(initialMetricsState)).toEqual({
			activeMetric: null,
			selectedMetrics: [],
			dirty: false,
		});
	});
});
