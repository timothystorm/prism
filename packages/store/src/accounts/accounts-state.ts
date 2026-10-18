import { z } from "zod";
import { AccountsSchema } from "./accounts-schema";

/**
 * Account identifiers currently selected to focus application filters and status.
 * An empty array represents no selections. The full list of accessible accounts is not stored here.
 * Controllers manage the dirty flag.
 */
export const AccountsStateSchema = z.object({
	activeAccounts: AccountsSchema,
	dirty: z.boolean().default(false),
});

export type AccountsState = z.infer<typeof AccountsStateSchema>;

/** Initial accounts selection state. */
export const initialAccountsState: AccountsState = {
	activeAccounts: [],
	dirty: false,
};
