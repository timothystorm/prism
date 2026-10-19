import { afterEach, describe, expect, test, vi } from "vitest";
import { TimeOnlySchema, TimeRangeSchema } from "./time-schema";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("TimeOnlySchema", () => {
  test.each(["00:00", "01:02", "12:30", "23:59", "00:00:00", "01:02:03", "12:30:45", "23:59:59"])(
    "preserves valid minute- or second-precision time %s",
    (time) => {
      expect(TimeOnlySchema.parse(time)).toBe(time);
    },
  );

  test.each([
    "",
    "9:00:00",
    "09:0:00",
    "09:00:0",
    "9:00",
    "09:0",
    "24:00",
    "12:60",
    "12:30.5",
    "12:30Z",
    "12:30+05:30",
    "24:00:00",
    "12:60:00",
    "23:59:60",
    "12:30:45.123",
    "12:30:45Z",
    "12:30:45+05:30",
    "2026-10-17T12:30:45",
    " 12:30:45 ",
    null,
    undefined,
    123045,
    new Date("2026-10-17T12:30:45Z"),
  ])("rejects invalid, zoned, or non-string time: %j", (time) => {
    expect(TimeOnlySchema.safeParse(time).success).toBe(false);
  });
});

describe("TimeRangeSchema", () => {
  test.each([
    { start: "00:00:00", end: "23:59:59" },
    { start: "09:59:59", end: "10:00:00" },
    { start: "12:30:45", end: "12:30:46" },
    { start: "08:00", end: "17:00" },
    { start: "09:00", end: "09:00:01" },
    { start: "08:59:59", end: "09:00" },
  ])("preserves same-day ranges without modifying input: %j", (input) => {
    const original = { ...input };

    expect(TimeRangeSchema.parse(input)).toEqual(original);
    expect(input).toEqual(original);
  });

  test.each(["UTC", "America/Chicago", "America/New_York", "Asia/Kolkata"])(
    "does not convert times when the runtime timezone is %s",
    (timeZone) => {
      vi.stubEnv("TZ", timeZone);

      expect(TimeRangeSchema.parse({ start: "09:00:00", end: "17:30:00" })).toEqual({
        start: "09:00:00",
        end: "17:30:00",
      });
      expect(TimeRangeSchema.parse({ start: "09:00", end: "17:30" })).toEqual({
        start: "09:00",
        end: "17:30",
      });
    },
  );

  test.each([
    { start: "12:00:00", end: "12:00:00" },
    { start: "12:00:01", end: "12:00:00" },
    { start: "23:00:00", end: "01:00:00" },
    { start: "12:00", end: "12:00" },
    { start: "12:00", end: "12:00:00" },
    { start: "12:00:00", end: "12:00" },
    { start: "12:00:01", end: "12:00" },
    { start: "23:00", end: "01:00" },
  ])("rejects equal, reversed, or overnight ranges on end: %j", (input) => {
    const result = TimeRangeSchema.safeParse(input);

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
    { start: "09:00:00" },
    { end: "17:30:00" },
    { start: null, end: "17:30:00" },
    { start: "09:0", end: "17:30:00" },
    { start: "09:00:00", end: "24:00:00" },
    { start: "09:00:00Z", end: "17:30:00Z" },
    { start: "09:00:00", end: "17:30:00.000" },
  ])("rejects malformed ranges: %j", (input) => {
    expect(TimeRangeSchema.safeParse(input).success).toBe(false);
  });
});
