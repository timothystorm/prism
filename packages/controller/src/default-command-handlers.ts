import type { UserProvider } from "@fedex/prism-providers";
import type { AppStore } from "@fedex/prism-store";
import type { CommandHandler } from "./handler/command-handler";
import { SetActiveFiltersHandler } from "./handler/set-active-filters-handler";
import { SetActiveMetricHandler } from "./handler/set-active-metric-handler";
import { FilterPolicy } from "./policies/filter-policy";

/**
 * Interface representing the dependencies required for creating default command handlers.
 */
export interface DefaultCommandHandlerDependencies {
  store: AppStore;
  userProvider: UserProvider;
}

/**
 * Creates an array of default command handlers with the provided dependencies.
 *
 * @param dependencies - An object containing the required dependencies for the command handlers.
 * @returns An array of default command handlers.
 */
export function createDefaultCommandHandlers(
  dependencies: DefaultCommandHandlerDependencies,
): CommandHandler[] {
  const filterPolicy = new FilterPolicy(dependencies.userProvider);
  return [
    new SetActiveFiltersHandler(dependencies.store, filterPolicy),
    new SetActiveMetricHandler(dependencies.store),
  ];
}
