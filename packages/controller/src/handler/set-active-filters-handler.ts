import type { AppStore } from "@fedex/prism-store";
import type { SetActiveFiltersCommand } from "../commands/commands-schema";
import type { FilterPolicy } from "../policies/filter-policy";
import type { CommandHandler } from "./command-handler";

export class SetActiveFiltersHandler implements CommandHandler<SetActiveFiltersCommand> {
  readonly type = "FILTERS:SET_ACTIVE";

  constructor(
    private readonly store: AppStore,
    private readonly policy: FilterPolicy,
  ) {}

  async handle(command: SetActiveFiltersCommand): Promise<void> {
    const allowedFilters = await this.policy.allowedFilters(command.filters);
    this.store.filters.setActiveFilters(allowedFilters);
  }
}
