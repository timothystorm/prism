import { describe, expect, test } from "vitest";
import { DateRangeSchema, DateTimeRangeSchema } from "./date-schema";

describe("DateRangeSchema", () => {
  test.each([
    {
      start: "2026-10-17",
      end: "2026-10-22",
    },
    {
      start: "2026-10-17",
      end: "2026-10-17",
    },
    {
      start: "2028-02-29",
      end: "2028-03-01",
    },
  ])("preserves calendar dates without adding time or timezone: %j", (range) => {
    expect(DateRangeSchema.parse(range)).toEqual(range);
  });

  test("reports reversed dates on end", () => {
    const result = DateRangeSchema.safeParse({
      start: "2026-10-18",
      end: "2026-10-17",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ["end"] })]),
      );
    }
  });

  test.each([
    null,
    {},
    { start: "2026-10-17" },
    { end: "2026-10-18" },
    { start: "2026-02-30", end: "2026-03-01" },
    { start: "2026-02-29", end: "2026-03-01" },
    { start: "2026-1-17", end: "2026-10-18" },
    { start: "10/17/2026", end: "2026-10-18" },
    { start: "2026-10-17T00:00:00.000Z", end: "2026-10-18T23:59:59.999Z" },
    { start: "2026-10-17T00:00:00Z", end: "2026-10-18T23:59:59Z" },
    { start: "2026-10-17T00:00:00.000", end: "2026-10-18T23:59:59.999" },
    {
      start: "2026-10-17T00:00:00.000-06:00",
      end: "2026-10-18T23:59:59.999-06:00",
    },
    {
      start: "2026-10-17T00:00:00.000+00:00",
      end: "2026-10-18T23:59:59.999+00:00",
    },
    { start: "", end: "2026-10-18" },
    { start: "2026-10-17", end: "invalid" },
    { start: null, end: "2026-10-18" },
    { start: 0, end: "2026-10-18" },
    {
      start: new Date("2026-10-17T00:00:00.000Z"),
      end: new Date("2026-10-18T23:59:59.999Z"),
    },
  ])("rejects missing or invalid calendar dates and time-bearing values: %j", (range) => {
    expect(DateRangeSchema.safeParse(range).success).toBe(false);
  });
});

describe("DateTimeRangeSchema", () => {
  test.each([
    { start: "2026-10-31T00:00:00Z", end: "2026-10-31T12:00:00Z" },
    { start: "2026-10-31T00:00:00.000Z", end: "2026-10-31T12:00:00.123Z" },
    { start: "2026-10-31T12:00:00Z", end: "2026-10-31T12:00:00.001Z" },
    { start: "2026-10-31T23:59:59.999Z", end: "2026-11-01T00:00:00Z" },
    { start: "2026-12-31T23:59:59Z", end: "2027-01-01T00:00:00.000Z" },
    { start: "2028-02-29T00:00:00Z", end: "2028-03-01T00:00:00Z" },
  ])("preserves ordered UTC timestamps without normalization: %j", (range) => {
    expect(DateTimeRangeSchema.parse(range)).toEqual(range);
  });

  test.each([
    { start: "2026-10-31T12:00:00Z", end: "2026-10-31T12:00:00Z" },
    { start: "2026-10-31T12:00:00Z", end: "2026-10-31T12:00:00.000Z" },
    { start: "2026-10-31T12:00:00.000Z", end: "2026-10-31T12:00:00Z" },
    { start: "2026-10-31T12:00:00.001Z", end: "2026-10-31T12:00:00Z" },
    { start: "2026-11-01T00:00:00Z", end: "2026-10-31T23:59:59.999Z" },
  ])("rejects equal instants or reversed ranges on end: %j", (range) => {
    const result = DateTimeRangeSchema.safeParse(range);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: "custom", path: ["end"] })]),
      );
    }
  });

  test.each([
    null,
    {},
    { start: "2026-10-31T00:00:00Z" },
    { end: "2026-10-31T12:00:00Z" },
    { start: "2026-02-30T00:00:00Z", end: "2026-03-01T00:00:00Z" },
    { start: "2026-10-31T24:00:00Z", end: "2026-11-01T12:00:00Z" },
    { start: "2026-10-31", end: "2026-11-01" },
    { start: "00:00:00", end: "12:00:00" },
    { start: "2026-10-31T00:00:00", end: "2026-10-31T12:00:00" },
    { start: "2026-10-31T00:00:00+00:00", end: "2026-10-31T12:00:00+00:00" },
    { start: "2026-10-31T00:00:00-06:00", end: "2026-10-31T12:00:00-06:00" },
    { start: "2026-10-31T00:00Z", end: "2026-10-31T12:00Z" },
    { start: "2026-10-31T00:00:00.1Z", end: "2026-10-31T12:00:00.1234Z" },
    { start: null, end: "2026-10-31T12:00:00Z" },
    { start: 0, end: "2026-10-31T12:00:00Z" },
    {
      start: new Date("2026-10-31T00:00:00Z"),
      end: new Date("2026-10-31T12:00:00Z"),
    },
  ])("rejects missing or invalid UTC datetime endpoints: %j", (range) => {
    expect(DateTimeRangeSchema.safeParse(range).success).toBe(false);
  });
});
