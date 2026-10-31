import { z } from "zod";

/**
 * Tiers are ordered from lowest to highest, with UNKNOWN being the lowest and ELITE being the highest.
 * The order of the tiers is important for determining the highest tier among a user's accounts.
 */
export const Tiers = ["UNKNOWN", "FREE", "BASIC", "PREMIUM", "PREMIER", "ELITE"] as const;

export const TierSchema = z.enum(Tiers);
export type Tier = z.infer<typeof TierSchema>;
