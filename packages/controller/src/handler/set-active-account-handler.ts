import type { AppStore } from "@fedex/prism-store";
import type { SetActiveAccountsCommand } from "../commands/commands-schema";
import type { CommandHandler } from "./command-handler";

export class SetActiveAccountHandler implements CommandHandler<SetActiveAccountsCommand> {
  readonly type = "ACCOUNTS:SET_ACTIVE";

  constructor(private readonly store: AppStore) {}

  handle(command: SetActiveAccountsCommand): Promise<void> | void {
    this.store.account.setActiveAccounts(command.accounts);
  }
}
