import { z } from "zod";
import { StatusSchema } from "./statuses-schema";

/**
 * Schema for shipment status selections. Each identifier is an independent OR term.
 * An empty array represents no selections. Parent and child selections are not expanded or collapsed.
 *
 * @example
 * const statusesState: StatusesState = {
 *   selectedStatuses: [
 *     "LABEL_CREATED",
 *     "EXCEPTION:DAMAGED_PACKAGE"
 *   ]
 * };
 */
export const StatusesStateSchema = z.object({
	selectedStatuses: z.array(StatusSchema),
});

/**
 * Types for statuses state.
 */
export type StatusesState = z.infer<typeof StatusesStateSchema>;

/**
 * Initial state for statuses.
 */
export const initialStatusesState: StatusesState = {
	selectedStatuses: [],
};
