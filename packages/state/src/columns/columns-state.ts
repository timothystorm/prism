import { z } from "zod";
import { ColumnsSchema } from "./columns-schema";

/**
 * Schema for the columns state.
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
 * Types for columns state.
 */
export type ColumnsState = z.infer<typeof ColumnsStateSchema>;

/**
 * Initial state for columns.
 */
export const initialColumnsState: ColumnsState = {
	selectedColumns: [
		{ name: "trackId" },
		{ name: "status" },
		{ name: "estimatedDeliveryDate" },
	],
};
