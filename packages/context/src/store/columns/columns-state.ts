import { z } from "zod";

/**
 * Schemas and types for columns store.
 *
 * @example
 * const columns: Columns = [
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
	.refine((columns) => columns.some((column) => column.name === "trackId"), {
		error: "The 'trackId' column is required",
	})
	.refine(
		(columns) => new Set(columns.map((c) => c.name)).size === columns.length,
		{ error: "Columns must be unique" },
	);

/**
 * Types for column selections.
 */
export type Columns = z.infer<typeof ColumnsSchema>;

/**
 * Schema for the columns store.
 *
 * @example
 * const columnsState: ColumnsState = {
 *   selectedColumns: [
 *     { name: "trackId" },
 *     { name: "estimatedDeliveryDate", sortDirection: "desc" }
 *   ]
 * };
 */
export const ColumnsStateSchema = z.object({
	selectedColumns: ColumnsSchema,
});

/**
 * Types for columns store.
 */
export type ColumnsState = z.infer<typeof ColumnsStateSchema>;

/**
 * Initial store for columns.
 */
export const initialColumnsState: ColumnsState = {
	selectedColumns: [
		{ name: "trackId" },
		{ name: "status" },
		{ name: "estimatedDeliveryDate" },
	],
};
