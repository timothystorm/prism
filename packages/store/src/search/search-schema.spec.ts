import { describe, expect, test } from "vitest";
import { SearchCategorySchema, SearchSchema } from "../index";

describe("SearchSchema", () => {
  test.each(["TRACKING_NUMBER", "SHIPPER_REFERENCE", "DESTINATION_CITY"])(
    "accepts search category %s",
    (category) => {
      expect(SearchCategorySchema.parse(category)).toBe(category);
      expect(SearchSchema.parse({ query: "  Abc-123  ", category })).toEqual({
        query: "  Abc-123  ",
        category,
      });
    },
  );

  test("allows an empty query to clear a search without changing its category", () => {
    expect(SearchSchema.parse({ query: "", category: "SHIPPER_REFERENCE" })).toEqual({
      query: "",
      category: "SHIPPER_REFERENCE",
    });
  });

  test.each([
    null,
    {},
    { query: "123" },
    { category: "TRACKING_NUMBER" },
    { query: null, category: "TRACKING_NUMBER" },
    { query: 123, category: "TRACKING_NUMBER" },
    { query: "123", category: "UNKNOWN" },
    { query: "123", category: null },
  ])("rejects incomplete or invalid searches without coercion: %j", (input) => {
    expect(SearchSchema.safeParse(input).success).toBe(false);
  });
});
