import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import { type TrackIds, TrackIdsSchema } from "./track-ids-schema";

/**
 * Stores the optional flat tracking-ID selection without a dirty flag or loading behavior.
 * Unlike other slices, getState()/setState() operate on the array itself, not a wrapper object.
 * Returned arrays are store-owned snapshots and must not be mutated directly.
 */
export class TrackIdsStore extends BaseStore<"trackIds"> {
  protected readonly sliceKey = "trackIds";
  protected readonly stateSchema = TrackIdsSchema;

  /** Returns the selected IDs, an empty array for no IDs, or undefined when absent. */
  getActiveTrackIds(): TrackIds {
    return this.getState();
  }

  /**
   * Validates and replaces the whole selection, preserving order and duplicate IDs.
   *
   * @param activeTrackIds The replacement IDs, [] for an empty selection, or undefined to unset it.
   * @throws ZodError If the input is not an optional array of strings. State remains unchanged.
   */
  setActiveTrackIds(activeTrackIds: TrackIds): void {
    const validated = TrackIdsSchema.parse(activeTrackIds);
    this.setAppState(
      produce<AppState>((state) => {
        state.trackIds = validated;
      }),
    );
  }
}
