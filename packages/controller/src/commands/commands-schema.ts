import {
	AccountsSchema,
	ColumnsSchema,
	FilterSchema,
	MetricTypeSchema,
	SearchSchema,
	StatusSchema,
} from "@fedex/prism-store";
import { z } from "zod";

export const SetActiveAccountsCommandSchema = z.object({
	type: z.literal("ACCOUNTS:SET_ACTIVE"),
	accounts: AccountsSchema,
});

export type SetActiveAccountsCommand = z.infer<
	typeof SetActiveAccountsCommandSchema
>;

export const SetActiveMetricCommandSchema = z.object({
	type: z.literal("METRICS:SET_ACTIVE"),
	metric: MetricTypeSchema,
});

export type SetActiveMetricCommand = z.infer<
	typeof SetActiveMetricCommandSchema
>;

export const SetActiveColumnsCommandSchema = z.object({
	type: z.literal("COLUMNS:SET_ACTIVE"),
	columns: ColumnsSchema,
});

export const SetActiveFiltersCommandSchema = z.object({
	type: z.literal("FILTERS:SET_ACTIVE"),
	filter: FilterSchema,
});

export const SetSearchQueryCommandSchema = z.object({
	type: z.literal("SEARCH:SET_QUERY"),
	query: SearchSchema,
});

export const SetActiveStatusesCommandSchema = z.object({
	type: z.literal("STATUSES:SET_ACTIVE"),
	statuses: StatusSchema,
});

export const SetSelectedStatusCommandSchema = z.object({
	type: z.literal("STATUSES:SET_SELECTED"),
	status: StatusSchema,
});

export const ClearSearchQueryCommandSchema = z.object({
	type: z.literal("SEARCH:CLEAR_QUERY"),
});

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
