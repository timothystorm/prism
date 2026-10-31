import type { AppStore } from "@fedex/prism-store";
import type { SetActiveFiltersCommand } from "../commands/commands-schema";
import type { FilterPolicy } from "../policies/filter-policy";
import type { CommandHandler } from "./command-handler";

/**
 * Replaces active filters after loading the user's tier and removing ineligible entries.
 * Disallowed filters are silently omitted, not rejected; an empty allowed list clears selection.
 * Policy loading and store validation must succeed before this handler writes.
 * Preserves the dirty flag rather than marking the replacement as a new user edit.
 */
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
