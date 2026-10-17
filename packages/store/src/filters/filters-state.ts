import { z } from "zod";
import { FilterSchema } from "./filters-schema";

/**
 * Schema for the state of shipment filters. It includes an array of active filters and a dirty flag indicating whether the filters have been modified.
 *
 * @example
 * const filtersState: FiltersState = {
 *   active: [
 *     {
 *       type: "SHIPMENT:COMMIT_DATE",
 *       criteria: {
 *         start: "2023-01-01",
 *         end: "2023-01-31"
 *       }
 *     },
 *     {
 *       type: "SHIPMENT:DELIVERED_DATE",
 *       criteria: {
 *         start: "2023-02-01",
 *         end: "2023-02-28"
 *       }
 *     },
 *     {
 *       type: "SHIPPER:NAME",
 *       criteria: ["Acme Corp", "Globex Inc."]
 *     }
 *   ],
 *   dirty: true
 * };
 */
export const FilterStateSchema = z.object({
	active: z
		.array(FilterSchema)
		.refine(
			(filters) =>
				new Set(filters.map((filter) => filter.type)).size === filters.length,
			{ message: "Active filters must have unique filter types" },
		),
	dirty: z.boolean().default(false),
});

export type FiltersState = z.infer<typeof FilterStateSchema>;

export const initialFiltersState: FiltersState = {
	active: [],
	dirty: false,
};
