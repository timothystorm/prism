import { z } from "zod";
import { TierSchema } from "./tier-schema";

/**
 * Service account data, distinct from the selected-identifier list in shared contracts.
 * Validate remote records at the service boundary; UserProvider does not parse its results.
 */
export const AccountSchema = z.object({
  id: z.string(),
  accountTier: TierSchema,
});

export type Account = z.infer<typeof AccountSchema>;
