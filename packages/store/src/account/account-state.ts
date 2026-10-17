import { z } from "zod";

/**
 * Account identifiers currently selected to focus application filters and status.
 * An empty array represents no selections. The full list of accessible accounts is not stored here.
 * Controllers manage the dirty flag.
 */
export const AccountStateSchema = z.object({
	activeAccounts: z
		.array(z.string().min(1))
		.refine((accounts) => new Set(accounts).size === accounts.length, {
			message: "Accounts must be unique",
		}),
	dirty: z.boolean().default(false),
});

export type AccountState = z.infer<typeof AccountStateSchema>;

/** Initial account selection state. */
export const initialAccountState: AccountState = {
	activeAccounts: [],
	dirty: false,
};
