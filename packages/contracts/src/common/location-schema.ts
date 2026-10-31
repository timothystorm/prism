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
 * One origin/destination attribute and its supplied text.
 * Validates the attribute name, not the meaning of the value: no address validation,
 * geocoding, or location normalization is performed, and empty strings are accepted.
 *
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
