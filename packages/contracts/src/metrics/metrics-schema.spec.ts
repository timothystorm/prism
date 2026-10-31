import { describe, expect, test } from "vitest";
import { BuiltInMetricTypeSchema, CustomMetricTypeSchema, MetricTypeSchema } from "../index";

describe("MetricTypeSchema", () => {
  test.each([
    "ACTIVE_SHIPMENTS",
    "ARRIVING_EARLY",
    "DELAYED",
    "DELIVERED",
    "DELIVERED_TODAY",
    "DELIVERING_TODAY",
    "DELIVERY_UPDATED",
    "EXCEPTION",
    "IN_TRANSIT",
    "LABEL_CREATED",
    "MISSED_PROMISE",
    "ON_TIME",
    "OUT_FOR_DELIVERY",
    "RETURN_TO_SHIPPER",
    "AT_RISK",
    "WATCH_LIST",
    "WE_TRIED_TO_DELIVER",
  ])("accepts built-in metric %s but not as a custom metric", (type) => {
    expect(BuiltInMetricTypeSchema.parse(type)).toBe(type);
    expect(MetricTypeSchema.parse(type)).toBe(type);
    expect(CustomMetricTypeSchema.safeParse(type).success).toBe(false);
  });

  test.each(["CUSTOM:MY_METRIC", "CUSTOM:lowercase", "CUSTOM:"])(
    "accepts custom metric %s but not as a built-in metric",
    (type) => {
      expect(CustomMetricTypeSchema.parse(type)).toBe(type);
      expect(MetricTypeSchema.parse(type)).toBe(type);
      expect(BuiltInMetricTypeSchema.safeParse(type).success).toBe(false);
    },
  );

  test.each(["UNKNOWN", "custom:MY_METRIC", "CUSTOM", "", null, 42])(
    "rejects invalid metric type: %j",
    (type) => {
      expect(MetricTypeSchema.safeParse(type).success).toBe(false);
    },
  );
});
