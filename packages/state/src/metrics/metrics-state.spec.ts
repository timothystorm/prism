import { describe, expect, test } from "vitest";
import { initialMetricsState, MetricsStateSchema } from "./metrics-state";

describe("MetricsStateSchema", () => {
	test.each([
		{ trackedMetrics: [] },
		{ focusedMetric: null, trackedMetrics: [] },
		{ focusedMetric: undefined, trackedMetrics: [] },
		{ focusedMetric: "EXCEPTION", trackedMetrics: ["EXCEPTION", "CUSTOM:ONE"] },
		{ focusedMetric: "CUSTOM:ONE", trackedMetrics: ["CUSTOM:ONE"] },
	])("accepts valid focus and tracked metrics: %j", (state) => {
		expect(MetricsStateSchema.parse(state)).toEqual(state);
	});

	test("allows focus independently of tracked metrics", () => {
		const state = { focusedMetric: "EXCEPTION", trackedMetrics: [] };
		expect(MetricsStateSchema.parse(state)).toEqual(state);
	});

	test("preserves the order of unique tracked metrics", () => {
		const state = {
			trackedMetrics: ["CUSTOM:ONE", "LABEL_CREATED", "EXCEPTION"],
		};
		expect(MetricsStateSchema.parse(state)).toEqual(state);
	});

	test.each([
		{ trackedMetrics: ["EXCEPTION", "EXCEPTION"] },
		{ trackedMetrics: ["CUSTOM:ONE", "LABEL_CREATED", "CUSTOM:ONE"] },
	])("rejects duplicate tracked metrics: %j", (state) => {
		const result = MetricsStateSchema.safeParse(state);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						code: "custom",
						path: ["trackedMetrics"],
					}),
				]),
			);
		}
	});

	test.each([
		null,
		{},
		{ focusedMetric: "EXCEPTION" },
		{ focusedMetric: "UNKNOWN", trackedMetrics: [] },
		{ focusedMetric: 42, trackedMetrics: [] },
		{ trackedMetrics: null },
		{ trackedMetrics: "EXCEPTION" },
		{ trackedMetrics: ["EXCEPTION", "UNKNOWN"] },
		{ trackedMetrics: [{ type: "EXCEPTION", value: 42 }] },
	])("rejects invalid metrics state: %j", (state) => {
		expect(MetricsStateSchema.safeParse(state).success).toBe(false);
	});

	test("starts with no focus and no tracked metrics", () => {
		expect(MetricsStateSchema.parse(initialMetricsState)).toEqual({
			focusedMetric: null,
			trackedMetrics: [],
		});
	});
});
