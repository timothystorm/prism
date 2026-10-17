import { z } from "zod";
import { ColumnsSchema } from "./columns-schema";

/**
 * Schema for the columns state.
 *
 * @example
 * const columnsState: ColumnsState = {
 *   selectedColumns: [
 *     { name: "TRACKING_ID" },
 *     { name: "EST_DELIVERY", sortDirection: "desc" }
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
		{ name: "TRACKING_ID" },
		{ name: "STATUS" },
		{ name: "EST_DELIVERY" },
	],
};
