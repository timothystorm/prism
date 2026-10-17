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
 *     "EXCEPTION", 									// include parent status - explicitly
 *     "EXCEPTION:DAMAGED_PACKAGE"    // include children of parent status - explicitly
 *   ],
 *   dirty: true
 * };
 */
export const StatusesStateSchema = z.object({
	selectedStatuses: z
		.array(StatusSchema)
		.refine((statuses) => new Set(statuses).size === statuses.length, {
			message: "Statuses must be unique",
		}),
	dirty: z.boolean().default(false),
});

export type StatusesState = z.infer<typeof StatusesStateSchema>;

export const initialStatusesState: StatusesState = {
	selectedStatuses: [],
	dirty: false,
};
