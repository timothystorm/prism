import type { UserProvider } from "@fedex/prism-providers";
import type { AppStore } from "@fedex/prism-store";
import type { CommandHandler } from "./handler/command-handler";
import { SetActiveFiltersHandler } from "./handler/set-active-filters-handler";
import { SetActiveMetricHandler } from "./handler/set-active-metric-handler";
import { FilterPolicy } from "./policies/filter-policy";

/**
 * Shared application-scope dependencies used by the built-in handlers.
 * Use the same instances as the clients that should observe the resulting selections.
 */
export interface DefaultCommandHandlerDependencies {
  store: AppStore;
  userProvider: UserProvider;
}

/**
 * Creates handlers for FILTERS:SET_ACTIVE and METRICS:SET_ACTIVE only.
 * This does not install handlers for every member of AppCommandSchema or load user data.
 * Pass the result to AppController; account, status, column, and search commands need
 * separately supplied handlers. This factory is not exported by the package root.
 *
 * @example
 * const handlers = createDefaultCommandHandlers({ store, userProvider });
 * const controller = new AppController(handlers);
 * await controller.dispatch({ type: "METRICS:SET_ACTIVE", metric: "EXCEPTION" });
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
