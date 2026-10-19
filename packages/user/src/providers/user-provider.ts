import { type Account, type Tier, Tiers } from "../schemas/user-schema";
import type { UserService } from "../services/user-service";

export class UserProvider {
  private _accounts?: Account[] | undefined;
  private _pendingAccounts?: Promise<Account[]> | undefined;

  constructor(private readonly userService: UserService) {}

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

  async readUserTier(): Promise<Tier> {
    const accounts = await this.readAccounts();
    return this.getHighestTier(accounts);
  }

  private getHighestTier(accounts: Account[]): Tier {
    if (accounts.length === 0) return "UNKNOWN";
    return accounts.reduce<Tier>(
      (highest, account) =>
        Tiers.indexOf(account.accountTier) > Tiers.indexOf(highest) ? account.accountTier : highest,
      "UNKNOWN",
    );
  }
}
