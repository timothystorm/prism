import {
  AccountsSchema,
  ColumnsSchema,
  FilterSchema,
  MetricTypeSchema,
  SearchSchema,
  StatusSchema,
} from "@fedex/prism-contracts";
import { z } from "zod";

export const SetActiveAccountsCommandSchema = z.object({
  type: z.literal("ACCOUNTS:SET_ACTIVE"),
  accounts: AccountsSchema,
});

export type SetActiveAccountsCommand = z.infer<typeof SetActiveAccountsCommandSchema>;

/**
 * Activates one metric identifier. Unlike MetricsStore.setActiveMetric(), this command
 * does not accept null to clear the activation.
 */
export const SetActiveMetricCommandSchema = z.object({
  type: z.literal("METRICS:SET_ACTIVE"),
  metric: MetricTypeSchema,
});

export type SetActiveMetricCommand = z.infer<typeof SetActiveMetricCommandSchema>;

export const SetActiveColumnsCommandSchema = z.object({
  type: z.literal("COLUMNS:SET_ACTIVE"),
  columns: ColumnsSchema,
});

export type SetActiveColumnsCommand = z.infer<typeof SetActiveColumnsCommandSchema>;

/**
 * Requests replacement of the active-filter list, not an append or merge.
 * Parses each filter and its defaults; list uniqueness is enforced by the store.
 * Entitlement filtering is a handler responsibility, not envelope validation.
 */
export const SetActiveFiltersCommandSchema = z.object({
  type: z.literal("FILTERS:SET_ACTIVE"),
  filters: z.array(FilterSchema),
});

export type SetActiveFiltersCommand = z.infer<typeof SetActiveFiltersCommandSchema>;

export const SetSearchQueryCommandSchema = z.object({
  type: z.literal("SEARCH:SET_QUERY"),
  query: SearchSchema,
});

export const SetActiveStatusesCommandSchema = z.object({
  type: z.literal("STATUSES:SET_ACTIVE"),
  statuses: z.array(StatusSchema),
});

export const SetSelectedStatusCommandSchema = z.object({
  type: z.literal("STATUSES:SET_SELECTED"),
  status: StatusSchema,
});

/**
 * Standalone clear-search envelope, currently excluded from AppCommandSchema.
 * Parsing with this schema does not make SEARCH:CLEAR_QUERY dispatchable by AppController.
 */
export const ClearSearchQueryCommandSchema = z.object({
  type: z.literal("SEARCH:CLEAR_QUERY"),
});

/**
 * Accepted command envelopes for AppController, selected by their `type` discriminator.
 * Acceptance does not imply that a handler is installed: the default factory covers only
 * filters and metrics. Add a schema here and register its handler for a new dispatchable command.
 */
export const AppCommandSchema = z.discriminatedUnion("type", [
  SetActiveAccountsCommandSchema,
  SetActiveMetricCommandSchema,
  SetActiveColumnsCommandSchema,
  SetActiveFiltersCommandSchema,
  SetActiveStatusesCommandSchema,
  SetSelectedStatusCommandSchema,
  SetSearchQueryCommandSchema,
]);

export type AppCommand = z.infer<typeof AppCommandSchema>;
