import { type Status, StatusSchema } from "@fedex/prism-contracts";
import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import { StatusesStateSchema } from "./statuses-state";

/**
 * A class that provides actions to manipulate the statuses state in the application.
 *
 * This should only manage state and not contain any business logic. It is designed to be used with a state management
 * library like Zustand but should not be tied to any specific implementation - no Zustand types should be used here.
 */
export class StatusesStore extends BaseStore<"statuses"> {
  protected readonly sliceKey = "statuses";
  protected readonly stateSchema = StatusesStateSchema;

  /**
   * Appends a valid status unless already selected, without changing the dirty flag.
   * Duplicate additions leave state and subscriptions unchanged.
   */
  addActiveStatuses(status: string): Status[] {
    const validated = StatusSchema.parse(status);
    this.setAppState(
      produce<AppState>((state) => {
        if (state.statuses.activeStatuses.includes(validated)) return;
        state.statuses.activeStatuses.push(validated);
      }),
    );
    return this.getState().activeStatuses;
  }

  /**
   * @return The currently selected parent and child status identifiers, or an empty array if none are selected.
   */
  getActiveStatuses(): Status[] {
    return this.getState().activeStatuses;
  }

  /**
   * Sets the selected status identifiers as independent OR terms without expanding or collapsing selections.
   * An empty array clears the selections.
   * Preserves the dirty flag; controllers manage it through setState().
   *
   * @param statuses The parent and child status identifiers to set as selected.
   * @throws ZodError If the selections are invalid. The state remains unchanged.
   */
  setActiveStatuses(statuses: string[]): void {
    const validated = StatusesStateSchema.shape.activeStatuses.parse(statuses);
    this.setAppState(
      produce<AppState>((state) => {
        state.statuses.activeStatuses = validated;
      }),
    );
  }
}
