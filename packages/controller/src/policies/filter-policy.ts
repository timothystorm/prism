import type { Filter } from "@fedex/prism-contracts";
import { type Tier, Tiers, type UserProvider } from "@fedex/prism-providers";

/**
 * Client-side filter eligibility based on the highest tier across the provider's accounts.
 * Selected account IDs in AppStore do not affect this policy. UNKNOWN permits no filters;
 * estimated-delivery datetimes require PREMIUM, and other types currently require BASIC.
 * This client-side policy is not a substitute for backend authorization.
 */
export class FilterPolicy {
  constructor(private readonly userProvider: UserProvider) {}

  /**
   * Checks one filter against the loaded user tier without modifying it or the store.
   *
   * @throws Propagates user-account loading failures.
   */
  async canUse(filter: Filter): Promise<boolean> {
    const userTier = await this.userProvider.readUserTier();
    if (userTier === "UNKNOWN") return false;

    const requiredTier = this.requiredTier(filter.type);
    return this.meetsTier(userTier, requiredTier);
  }

  /**
   * Reads the user's tier once and returns eligible entries in their original order.
   * Returned entries retain their original references; input is not mutated or deduplicated.
   * UNKNOWN yields an empty list rather than a permission error.
   *
   * @throws Propagates user-account loading failures, even for an empty input list.
   */
  async allowedFilters(filters: Filter[]): Promise<Filter[]> {
    const userTier = await this.userProvider.readUserTier();
    if (userTier === "UNKNOWN") return [];
    return filters.filter((f) => this.meetsTier(userTier, this.requiredTier(f.type)));
  }

  /** Compares entitlement ranks using the shared Tiers ordering. */
  private meetsTier(actual: Tier, required: Tier): boolean {
    return Tiers.indexOf(actual) >= Tiers.indexOf(required);
  }

  /**
   * New filter types inherit the BASIC default unless explicitly assigned a higher tier here.
   */
  private requiredTier(type: Filter["type"]): Tier {
    switch (type) {
      case "SHIPMENT:EST_DELIVERY_DATE_TIME":
        return "PREMIUM";

      default:
        return "BASIC";
    }
  }
}
