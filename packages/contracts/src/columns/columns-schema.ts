import { z } from "zod";

/**
 * Schema for supported column identifiers.
 *
 * @example
 * const columnName = ColumnNameSchema.parse("TRACKING_ID");
 */
export const ColumnNameSchema = z.enum([
  "TRACKING_ID",
  "STATUS",
  "EST_DELIVERY",
  "ROUTE",
  "DELIVERY_PREDICTION",
  "TIME_IN_NETWORK",
]);

/**
 * Schema for a column with an optional sort direction.
 */
export const ColumnSchema = z.object({
  name: ColumnNameSchema,
  sortDirection: z.enum(["asc", "desc"]).optional(),
});

/**
 * Types for a column with an optional sort direction.
 *
 * @example
 * const column: Column = { name: "STATUS", sortDirection: "asc" };
 */
export type Column = z.infer<typeof ColumnSchema>;

/**
 * Schema for columns in display order. Column names must be unique, and TRACKING_ID is required.
 * TRACKING_ID may appear at any position; parsing preserves the supplied display order.
 * An empty array is invalid, so clearing all columns is not a supported selection.
 */
export const ColumnsSchema = z
  .array(ColumnSchema)

  // Ensure that the 'TRACKING_ID' column is present in the array
  .refine((columns) => columns.some((column) => column.name === "TRACKING_ID"), {
    error: "The 'TRACKING_ID' column is required",
  })

  // Ensure that all column names are unique
  .refine((columns) => new Set(columns.map((c) => c.name)).size === columns.length, {
    error: "Columns must be unique",
  });

/**
 * Types for column selections.
 */
export type Columns = z.infer<typeof ColumnsSchema>;
