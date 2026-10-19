import type { Filter } from "@fedex/prism-store";
import { type Tier, Tiers, type UserProvider } from "@fedex/prism-user";

/**
 * FilterPolicy class is responsible for determining if a user can use specific filters based on their tier. It provides
 * methods to check if a user can use a particular filter and to filter a list of filters based on the user's tier.
 */
export class FilterPolicy {
  constructor(private readonly userProvider: UserProvider) {}

  /**
   * Determines if the user can use a specific filter based on their tier.
   *
   * @param filter - The filter to be checked against the user's tier.
   * @returns A promise that resolves to a boolean indicating if the user can use the filter.
   */
  async canUse(filter: Filter): Promise<boolean> {
    const userTier = await this.userProvider.readUserTier();
    if (userTier === "UNKNOWN") return false;

    const requiredTier = this.requiredTier(filter.type);
    return this.meetsTier(userTier, requiredTier);
  }

  /**
   * Filters the provided list of filters based on the user's tier.
   *
   * @param filters - An array of filters to be checked against the user's tier.
   * @returns A promise that resolves to an array of filters that the user is allowed to use.
   */
  async allowedFilters(filters: Filter[]): Promise<Filter[]> {
    const userTier = await this.userProvider.readUserTier();
    if (userTier === "UNKNOWN") return [];
    return filters.filter((f) => this.meetsTier(userTier, this.requiredTier(f.type)));
  }

  /**
   * Determines if the actual tier meets or exceeds the required tier.
   *
   * @param actual - The actual tier of the user.
   * @param required - The required tier to access the filter.
   */
  private meetsTier(actual: Tier, required: Tier): boolean {
    return Tiers.indexOf(actual) >= Tiers.indexOf(required);
  }

  /**
   * Determines the required tier for a given filter type.
   *
   * @param type - The type of the filter.
   * @returns The required tier for the filter type.
   */
  private requiredTier(type: Filter["type"]): Tier {
    switch (type) {
      case "SHIPMENT:EST_DELIVERY_DATE":
      case "SHIPMENT:EST_DELIVERY_TIME":
        return "PREMIUM";

      default:
        return "BASIC";
    }
  }
}
