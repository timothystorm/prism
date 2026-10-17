import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import { AccountStateSchema } from "./account-state";

/**
 * Provides validated, immutable access to the active account selection.
 * Stores only selection state, without account-loading or filtering business logic.
 */
export class AccountStore extends BaseStore<"account"> {
	protected readonly sliceKey = "account";
	protected readonly stateSchema = AccountStateSchema;

	/** @return The selected account identifiers, or an empty array if none are selected. */
	get activeAccounts(): string[] {
		return this.state.activeAccounts;
	}

	/**
	 * Replaces the active account identifiers without changing the dirty flag.
	 * An empty array clears the selection.
	 *
	 * @param accounts Unique, non-empty account identifiers to select.
	 * @throws ZodError If the selection is invalid. The state remains unchanged.
	 */
	set activeAccounts(accounts: string[]) {
		const validated = AccountStateSchema.shape.activeAccounts.parse(accounts);
		this.setState(
			produce<AppState>((state) => {
				state.account.activeAccounts = validated;
			}),
		);
	}
}
