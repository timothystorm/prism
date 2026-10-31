import { type Columns, ColumnsSchema } from "@fedex/prism-contracts";
import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import { ColumnsStateSchema } from "./columns-state";

/**
 * A class that provides actions to manipulate the columns state in the application.
 *
 * This should only manage state and not contain any business logic. It is designed to be used with a state management
 * library like Zustand but should not be tied to any specific implementation - no Zustand types should be used here.
 */
export class ColumnsStore extends BaseStore<"columns"> {
  protected readonly sliceKey = "columns";
  protected readonly stateSchema = ColumnsStateSchema;

  /**
   * @return The currently selected columns in display order.
   */
  getActiveColumns(): Columns {
    return this.getState().activeColumns;
  }

  /**
   * Sets the currently selected columns in display order. Column names must be unique, and TRACKING_ID is required.
   * Preserves the dirty flag; controllers manage it through setState().
   *
   * @param columns The columns to set as selected.
   * @throws ZodError If the selections are invalid. The state remains unchanged.
   */
  setActiveColumns(columns: Columns): void {
    const validated = ColumnsSchema.parse(columns);
    this.setAppState(
      produce<AppState>((state) => {
        state.columns.activeColumns = validated;
      }),
    );
  }
}
