import { z } from "zod";

export const AccountsSchema = z
	.array(z.string().min(1))
	.refine((accounts) => new Set(accounts).size === accounts.length, {
		message: "Accounts must be unique",
	});

export type Accounts = z.infer<typeof AccountsSchema>;
