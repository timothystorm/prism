import { z } from "zod";

/**
 * Account identifiers currently selected to focus application filters and status.
 * An empty array represents no selections. The full list of accessible accounts is not stored here.
 * Controllers manage the dirty flag.
 */
export const AccountsStateSchema = z.object({
	active: z
		.array(z.string().min(1))
		.refine((accounts) => new Set(accounts).size === accounts.length, {
			message: "Accounts must be unique",
		}),
	dirty: z.boolean().default(false),
});

export type AccountsState = z.infer<typeof AccountsStateSchema>;

/** Initial accounts selection state. */
export const initialAccountsState: AccountsState = {
	active: [],
	dirty: false,
};
