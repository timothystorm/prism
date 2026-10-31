import type { Account } from "../schemas/account-schema";
import { type Tier, Tiers } from "../schemas/tier-schema";
import type { UserService } from "../services/user-service";

/**
 * Loads accounts through an injected service and caches them for this instance's lifetime.
 * Share one instance within a user/session scope to reuse data and in-flight requests.
 * There is no expiration or refresh API; create a new instance when the user changes
 * or fresh account data is required. This cache is independent of selected accounts in AppStore.
 *
 * Service results are trusted, not validated or copied here. Implement validation at
 * the service boundary and do not mutate the returned account objects or array.
 *
 * @example
 * import { GraphqlUserService, UserProvider } from "@fedex/prism-providers";
 *
 * const provider = new UserProvider(new GraphqlUserService());
 * const accounts = await provider.readAccounts();
 * const tier = await provider.readUserTier(); // Reuses the loaded accounts.
 */
export class UserProvider {
  private _accounts?: Account[] | undefined;
  private _pendingAccounts?: Promise<Account[]> | undefined;

  constructor(private readonly userService: UserService) {}

  /**
   * Reuses cached accounts, including an empty result, or shares one underlying fetch
   * with concurrent callers. A rejected fetch is not cached; the next read retries.
   *
   * @returns The cached account-array reference after a successful load.
   * @throws Propagates service failures to all callers awaiting the fetch.
   */
  async readAccounts(): Promise<Account[]> {
    if (this._accounts) return this._accounts;
    if (this._pendingAccounts) return this._pendingAccounts;

    this._pendingAccounts = this.userService
      .fetchAccounts()
      .then((accounts) => {
        this._accounts = accounts;
        return accounts;
      })
      .finally(() => {
        this._pendingAccounts = undefined;
      });
    return this._pendingAccounts;
  }

  /**
   * Reads the highest entitlement across all service-provided accounts, not just those selected in the UI.
   * Uses the rank in Tiers; no accounts (or only UNKNOWN accounts) yields UNKNOWN.
   *
   * @throws Propagates account-loading failures instead of treating them as an UNKNOWN tier.
   */
  async readUserTier(): Promise<Tier> {
    const accounts = await this.readAccounts();
    return this.getHighestTier(accounts);
  }

  /**
   * Compares the declared entitlement ranks rather than sorting tier labels alphabetically.
   */
  private getHighestTier(accounts: Account[]): Tier {
    if (accounts.length === 0) return "UNKNOWN";
    return accounts.reduce<Tier>(
      (highest, account) =>
        Tiers.indexOf(account.accountTier) > Tiers.indexOf(highest) ? account.accountTier : highest,
      "UNKNOWN",
    );
  }
}
