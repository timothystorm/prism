import { z } from "zod";

/**
 * Supported ways to interpret a search query.
 * Category-specific query formats and search execution are controller responsibilities.
 */
export const SearchCategorySchema = z.enum([
	"TRACKING_NUMBER",
	"SHIPPER_REFERENCE",
	"DESTINATION_CITY",
]);

/** A supported search category. */
export type SearchCategory = z.infer<typeof SearchCategorySchema>;

/**
 * Validates a complete query/category selection without controller-managed metadata.
 * Both fields are required. An empty query clears the search within the supplied category.
 * Query text is preserved verbatim, without trimming, case conversion, or tokenization.
 *
 * @example
 * const search: Search = {
 *   query: "REF-123",
 *   category: "SHIPPER_REFERENCE",
 * };
 */
export const SearchSchema = z.object({
	query: z.string(),
	category: SearchCategorySchema,
});

/** A complete search selection, without its dirty flag. */
export type Search = z.infer<typeof SearchSchema>;
