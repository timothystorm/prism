import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import { ViewsStateSchema } from "./views-state";

/**
 * Provides validated, immutable access to the active view identifier shared with other components.
 * This should only manage state and not contain business logic or component configuration.
 * No state-management-library types are required.
 */
export class ViewsStore extends BaseStore<"views"> {
  protected readonly sliceKey = "views";
  protected readonly stateSchema = ViewsStateSchema;

  /** @return The active view identifier. */
  getActiveView(): string {
    return this.getState().activeView;
  }

  /**
   * Sets the active view identifier without changing the dirty flag or other selections.
   *
   * @param id A non-empty view identifier. View availability is managed outside the store.
   * @throws ZodError If the identifier is invalid. The state remains unchanged.
   */
  setActiveView(id: string): void {
    const validated = ViewsStateSchema.parse({
      ...this.getState(),
      activeView: id,
    });
    this.setAppState(
      produce<AppState>((state) => {
        state.views.activeView = validated.activeView;
      }),
    );
  }
}
