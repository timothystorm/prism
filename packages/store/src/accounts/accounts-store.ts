import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import { AccountsStateSchema } from "./accounts-state";

/**
 * Provides validated, immutable access to the active accounts' selection.
 * Stores only selection state, without accounts-loading or filtering business logic.
 */
export class AccountsStore extends BaseStore<"account"> {
	protected readonly sliceKey = "account";
	protected readonly stateSchema = AccountsStateSchema;

	/** @return The selected accounts identifiers, or an empty array if none are selected. */
	getActiveAccounts(): string[] {
		return this.getState().activeAccounts;
	}

	/**
	 * Replaces the active accounts identifiers without changing the dirty flag.
	 * An empty array clears the selection.
	 *
	 * @param accounts Unique, non-empty accounts identifiers to select.
	 * @throws ZodError If the selection is invalid. The state remains unchanged.
	 */
	setActiveAccounts(accounts: string[]): void {
		const validated = AccountsStateSchema.shape.activeAccounts.parse(accounts);
		this.setAppState(
			produce<AppState>((state) => {
				state.account.activeAccounts = validated;
			}),
		);
	}
}
