import type { Account } from "../schemas/account-schema";

/**
 * Account-loading boundary injected into UserProvider.
 * Implementations obtain and validate external data; the provider trusts returned accounts.
 * Caching and concurrent-request reuse belong to the provider, not this interface.
 */
export interface UserService {
  /**
   * Loads accessible accounts for the service's user context.
   * Return an empty array for no accounts; reject loading or validation failures so the
   * provider can retry rather than permanently cache an empty result as a successful load.
   */
  fetchAccounts(): Promise<Account[]>;
}
