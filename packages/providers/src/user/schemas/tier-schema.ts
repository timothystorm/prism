import { z } from "zod";

/**
 * Tiers are ordered from lowest to highest, with UNKNOWN being the lowest and ELITE being the highest.
 * UserProvider and FilterPolicy compare array positions, not tier names. Changing this order
 * changes both highest-tier selection and filter eligibility; it is not a presentation order.
 */
export const Tiers = ["UNKNOWN", "FREE", "BASIC", "PREMIUM", "PREMIER", "ELITE"] as const;

/** Validates known entitlement labels; their rank is defined by Tiers. */
export const TierSchema = z.enum(Tiers);
export type Tier = z.infer<typeof TierSchema>;
