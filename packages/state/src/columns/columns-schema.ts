import { z } from "zod";

/**
 * Schemas and types for columns state.
 *
 * @example
 * const columns: ColumnsSchema = [
 *   { name: "TRACKING_ID" },
 *   { name: "STATUS", sortDirection: "asc" }
 * ];
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
 * const column: Column = { name: "status", sortDirection: "asc" };
 */
export type Column = z.infer<typeof ColumnSchema>;

/**
 * Schema for columns in display order. Column names must be unique, and trackId is required.
 */
export const ColumnsSchema = z
	.array(ColumnSchema)

	// Ensure that the 'TRACKING_ID' column is present in the array
	.refine(
		(columns) => columns.some((column) => column.name === "TRACKING_ID"),
		{
			error: "The 'TRACKING_ID' column is required",
		},
	)

	// Ensure that all column names are unique
	.refine(
		(columns) => new Set(columns.map((c) => c.name)).size === columns.length,
		{ error: "Columns must be unique" },
	);

/**
 * Types for column selections.
 */
export type Columns = z.infer<typeof ColumnsSchema>;
