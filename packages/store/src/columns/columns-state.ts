import { ColumnsSchema } from "@fedex/prism-contracts";
import { z } from "zod";

/**
 * Schema for active columns and a controller-managed dirty flag.
 * The flag can track changes awaiting distribution; column updates do not toggle it.
 *
 * @example
 * const columnsState: ColumnsState = {
 *   activeColumns: [
 *     { name: "TRACKING_ID" },
 *     { name: "EST_DELIVERY", sortDirection: "desc" }
 *   ],
 *   dirty: false
 * };
 */
export const ColumnsStateSchema = z.object({
  activeColumns: ColumnsSchema,
  dirty: z.boolean().default(false),
});

/**
 * Types for columns state.
 */
export type ColumnsState = z.infer<typeof ColumnsStateSchema>;

/**
 * Initial state for columns.
 */
export const initialColumnsState: ColumnsState = {
  activeColumns: [{ name: "TRACKING_ID" }, { name: "STATUS" }, { name: "EST_DELIVERY" }],
  dirty: false,
};
