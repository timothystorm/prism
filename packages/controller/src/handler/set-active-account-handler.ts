import type { AppStore } from "@fedex/prism-store";
import type { SetActiveAccountsCommand } from "../commands/commands-schema";
import type { CommandHandler } from "./command-handler";

/**
 * Replaces selected account IDs without loading accounts or checking access permissions.
 * Preserves the slice's dirty flag. Register explicitly; the default factory omits this handler.
 */
export class SetActiveAccountHandler implements CommandHandler<SetActiveAccountsCommand> {
  readonly type = "ACCOUNTS:SET_ACTIVE";

  constructor(private readonly store: AppStore) {}

  handle(command: SetActiveAccountsCommand): Promise<void> | void {
    this.store.account.setActiveAccounts(command.accounts);
  }
}
