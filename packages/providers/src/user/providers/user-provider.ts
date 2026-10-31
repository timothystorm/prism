import type { Account } from "../schemas/account-schema";
import { type Tier, Tiers } from "../schemas/tier-schema";
import type { UserService } from "../services/user-service";

/**
 * UserProvider is responsible for managing user account data. It fetches the user's accounts from the UserService and
 * caches them for future use. It also provides methods to determine the highest tier among the user's accounts.
 */
export class UserProvider {
  private _accounts?: Account[] | undefined;
  private _pendingAccounts?: Promise<Account[]> | undefined;

  constructor(private readonly userService: UserService) {}

  /**
   * Fetches the user's accounts. If the accounts have already been fetched, it returns the cached accounts. If a fetch
   * is already in progress, it returns the pending promise.
   *
   * @returns A promise that resolves to an array of Account objects.
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
   * Fetches the highest tier among the user's accounts.
   *
   * @returns A promise that resolves to the highest Tier.
   */
  async readUserTier(): Promise<Tier> {
    const accounts = await this.readAccounts();
    return this.getHighestTier(accounts);
  }

  /**
   * Determines the highest tier among a list of accounts. If there are no accounts, it returns "UNKNOWN".
   *
   * @param accounts - An array of Account objects.
   * @returns The highest Tier among the accounts.
   * @private
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
