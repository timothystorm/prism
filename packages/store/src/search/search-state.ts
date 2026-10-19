import { z } from "zod";
import { SearchCategorySchema } from "./search-schema";

/**
 * Schema for the current search selection and a controller-managed dirty flag.
 * Omitted or undefined fields default to an empty query, TRACKING_NUMBER category, and dirty=false.
 * Invalid supplied values are rejected rather than defaulted; query text is not normalized.
 * SearchStore.setSearchTerm() preserves dirty. Controllers use setState() to change it.
 *
 * @example
 * const searchState: SearchState = {
 *   query: "Chicago",
 *   category: "DESTINATION_CITY",
 *   dirty: true,
 * };
 */
export const SearchStateSchema = z.object({
  query: z.string().default(""),
  category: SearchCategorySchema.default("TRACKING_NUMBER"),
  dirty: z.boolean().default(false),
});

/** The current search selection and controller-managed dirty status. */
export type SearchState = z.infer<typeof SearchStateSchema>;

/** Initial empty tracking-number search with dirty=false. */
export const initialSearchState: SearchState = {
  query: "",
  category: "TRACKING_NUMBER",
  dirty: false,
};
