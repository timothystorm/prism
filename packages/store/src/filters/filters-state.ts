import { z } from "zod";
import { FilterSchema } from "./filters-schema";

/**
 * Schema for active shipment filters with unique types and a controller-managed dirty flag.
 * Selection updates preserve dirty; controllers decide when changes need distribution.
 *
 * @example
 * const filtersState: FiltersState = {
 *   activeFilters: [
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
 *       type: "SHIPMENT:SHIPPER_NAME",
 *       criteria: ["Acme Corp", "Globex Inc."]
 *     }
 *   ],
 *   dirty: true
 * };
 */
export const FilterStateSchema = z.object({
  activeFilters: z
    .array(FilterSchema)
    .refine((filters) => new Set(filters.map((filter) => filter.type)).size === filters.length, {
      message: "Active filters must have unique filter types",
    }),
  dirty: z.boolean().default(false),
});

export type FiltersState = z.infer<typeof FilterStateSchema>;

export const initialFiltersState: FiltersState = {
  activeFilters: [],
  dirty: false,
};
