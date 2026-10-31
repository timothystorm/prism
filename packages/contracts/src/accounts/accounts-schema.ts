import { z } from "zod";

/**
 * Validates selected account identifiers, not account records or access permissions.
 * Identifiers must be non-empty and unique; an empty array clears the selection.
 * Strings and selection order are preserved without trimming or normalization.
 */
export const AccountsSchema = z
  .array(z.string().min(1))
  .refine((accounts) => new Set(accounts).size === accounts.length, {
    message: "Accounts must be unique",
  });

export type Accounts = z.infer<typeof AccountsSchema>;
