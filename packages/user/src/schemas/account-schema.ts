import { z } from "zod";
import { TierSchema } from "./tier-schema";

export const AccountSchema = z.object({
  id: z.string(),
  accountTier: TierSchema,
});

export type Account = z.infer<typeof AccountSchema>;
