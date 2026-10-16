import { z } from "zod";
import { ColumnsSchema } from "../../schemas/columns";

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
