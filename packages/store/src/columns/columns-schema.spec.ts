import { describe, expect, test } from "vitest";
import { ColumnNameSchema, ColumnSchema, ColumnsSchema } from "../index";

describe("ColumnNameSchema", () => {
  test.each([
    "TRACKING_ID",
    "STATUS",
    "EST_DELIVERY",
    "ROUTE",
    "DELIVERY_PREDICTION",
    "TIME_IN_NETWORK",
  ])("accepts the column name %s", (name) => {
    expect(ColumnNameSchema.parse(name)).toBe(name);
  });

  test.each(["unknown", "", null, undefined, 42])("rejects an invalid column name: %j", (name) => {
    expect(ColumnNameSchema.safeParse(name).success).toBe(false);
  });
});

describe("ColumnSchema", () => {
  test.each([
    { name: "TRACKING_ID" },
    { name: "STATUS", sortDirection: "asc" },
    { name: "EST_DELIVERY", sortDirection: "desc" },
  ])("accepts a column with optional sorting: %j", (column) => {
    expect(ColumnSchema.parse(column)).toEqual(column);
  });

  test.each([
    {},
    { name: "UNKNOWN" },
    { name: "TRACKING_ID", sortDirection: "ascending" },
    { name: "TRACKING_ID", sortDirection: null },
    { name: "TRACKING_ID", sortDirection: 1 },
    null,
  ])("rejects an invalid column: %j", (column) => {
    expect(ColumnSchema.safeParse(column).success).toBe(false);
  });
});

describe("ColumnsSchema", () => {
  test("accepts TRACKING_ID without any optional columns", () => {
    expect(ColumnsSchema.parse([{ name: "TRACKING_ID" }])).toEqual([{ name: "TRACKING_ID" }]);
  });

  test("preserves display order without requiring TRACKING_ID to be first", () => {
    const columns = [
      { name: "EST_DELIVERY", sortDirection: "desc" },
      { name: "TRACKING_ID" },
      { name: "STATUS", sortDirection: "asc" },
    ];

    expect(ColumnsSchema.parse(columns)).toEqual([
      { name: "EST_DELIVERY", sortDirection: "desc" },
      { name: "TRACKING_ID" },
      { name: "STATUS", sortDirection: "asc" },
    ]);
  });

  test.each([
    { columns: [] },
    { columns: [{ name: "STATUS" }] },
    {
      columns: [{ name: "STATUS" }, { name: "EST_DELIVERY" }],
    },
  ])("rejects selections missing trackId: $columns", ({ columns }) => {
    const result = ColumnsSchema.safeParse(columns);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "The 'TRACKING_ID' column is required",
          }),
        ]),
      );
    }
  });

  test.each([
    {
      columns: [{ name: "TRACKING_ID" }, { name: "TRACKING_ID" }],
    },
    {
      columns: [
        { name: "TRACKING_ID" },
        { name: "STATUS", sortDirection: "asc" },
        { name: "STATUS", sortDirection: "desc" },
      ],
    },
  ])("rejects duplicate names regardless of sorting: $columns", ({ columns }) => {
    const result = ColumnsSchema.safeParse(columns);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "Columns must be unique",
          }),
        ]),
      );
    }
  });

  test.each([
    { columns: [{ name: "TRACKING_ID" }, { name: "unknown" }] },
    { columns: [{ name: "TRACKING_ID", sortDirection: "ascending" }] },
    { columns: { name: "TRACKING_ID" } },
    { columns: null },
  ])("rejects malformed selections: $columns", ({ columns }) => {
    expect(ColumnsSchema.safeParse(columns).success).toBe(false);
  });
});
