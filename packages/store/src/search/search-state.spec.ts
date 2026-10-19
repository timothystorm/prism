import { describe, expect, test } from "vitest";
import { SearchStateSchema } from "../index";

describe("SearchStateSchema", () => {
  test.each([
    {
      input: {},
      expected: { query: "", category: "TRACKING_NUMBER", dirty: false },
    },
    {
      input: { query: "  Abc-123  " },
      expected: {
        query: "  Abc-123  ",
        category: "TRACKING_NUMBER",
        dirty: false,
      },
    },
    {
      input: { category: "DESTINATION_CITY" },
      expected: { query: "", category: "DESTINATION_CITY", dirty: false },
    },
    {
      input: { query: undefined, category: undefined, dirty: undefined },
      expected: { query: "", category: "TRACKING_NUMBER", dirty: false },
    },
  ])("applies defaults without normalizing supplied input: $input", ({ input, expected }) => {
    expect(SearchStateSchema.parse(input)).toEqual(expected);
  });

  test.each([false, true])("preserves supplied search and dirty=%s", (dirty) => {
    expect(
      SearchStateSchema.parse({
        query: "  Abc-123  ",
        category: "SHIPPER_REFERENCE",
        dirty,
      }),
    ).toEqual({
      query: "  Abc-123  ",
      category: "SHIPPER_REFERENCE",
      dirty,
    });
  });

  test.each([
    null,
    { query: null },
    { query: 123 },
    { category: "UNKNOWN" },
    { category: null },
    { dirty: "true" },
    { dirty: 1 },
    { dirty: null },
  ])("rejects invalid state fields rather than defaulting them: %j", (input) => {
    expect(SearchStateSchema.safeParse(input).success).toBe(false);
  });
});
