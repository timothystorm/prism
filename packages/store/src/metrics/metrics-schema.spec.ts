import { describe, expect, test } from "vitest";
import { MetricSchema, MetricValueSchema } from "../index";

describe("MetricValueSchema", () => {
  test.each([
    { value: "delivered" },
    { value: "" },
    { value: "2026-10-16T00:00:00.000Z" },
    { value: 0 },
    { value: -2.5 },
    { value: true },
    { value: false },
    { value: new Date("2026-10-16T00:00:00.000Z") },
  ])("accepts values without coercing their types: $value", ({ value }) => {
    const parsed = MetricValueSchema.parse(value);
    expect(parsed).toEqual(value);
    expect(typeof parsed).toBe(typeof value);
    expect(parsed instanceof Date).toBe(value instanceof Date);
  });

  test.each([
    { value: null },
    { value: undefined },
    { value: Number.NaN },
    { value: Number.POSITIVE_INFINITY },
    { value: new Date("invalid") },
    { value: [] },
    { value: {} },
  ])("rejects unsupported metric values: $value", ({ value }) => {
    expect(MetricValueSchema.safeParse(value).success).toBe(false);
  });
});

describe("MetricSchema", () => {
  test.each([
    { type: "EXCEPTION", value: 42 },
    { type: "CUSTOM:MESSAGE", value: "delayed" },
    { type: "CUSTOM:ENABLED", value: false },
    { type: "CUSTOM:DATE", value: new Date("2026-10-16T00:00:00.000Z") },
    { type: "LABEL_CREATED", value: null },
    { type: "LABEL_CREATED", value: undefined },
    { type: "LABEL_CREATED" },
  ])("accepts a metric with an optional nullable value: %j", (metric) => {
    expect(MetricSchema.parse(metric)).toEqual(metric);
  });

  test.each([
    {},
    { value: 42 },
    { type: "UNKNOWN", value: 42 },
    { type: "EXCEPTION", value: {} },
    { type: "EXCEPTION", value: [] },
    null,
  ])("rejects invalid metrics: %j", (metric) => {
    expect(MetricSchema.safeParse(metric).success).toBe(false);
  });
});
