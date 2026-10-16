import { z } from "zod";

/**
 * Schemas and types for columns state.
 *
 * @example
 * const columns: ColumnsSchema = [
 *   { name: "trackId" },
 *   { name: "status", sortDirection: "asc" }
 * ];
 */
export const ColumnNameSchema = z.enum([
	"trackId",
	"status",
	"estimatedDeliveryDate",
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

	// Ensure that the 'trackId' column is present in the array
	.refine((columns) => columns.some((column) => column.name === "trackId"), {
		error: "The 'trackId' column is required",
	})

	// Ensure that all column names are unique
	.refine(
		(columns) => new Set(columns.map((c) => c.name)).size === columns.length,
		{ error: "Columns must be unique" },
	);

/**
 * Types for column selections.
 */
export type Columns = z.infer<typeof ColumnsSchema>;
