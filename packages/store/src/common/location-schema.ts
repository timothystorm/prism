import { z } from "zod";

export const LocationAttributeTypeSchema = z.enum([
	"ADDRESS",
	"CITY",
	"STATE_OR_PROVINCE",
	"COUNTRY_OR_TERRITORY",
	"POSTAL_CODE",
]);

export type LocationAttributeType = z.infer<typeof LocationAttributeTypeSchema>;

/**
 * @example
 * {
 *   "type": "CITY",
 *   "value": "Chicago"
 * }
 */
export const LocationCriterionSchema = z.object({
	type: LocationAttributeTypeSchema,
	value: z.string(),
});

export type LocationCriterion = z.infer<typeof LocationCriterionSchema>;
