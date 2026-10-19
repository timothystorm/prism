import { produce } from "immer";
import type { AppState } from "../app-state";
import { BaseStore } from "../base-store";
import { type TrackIds, TrackIdsSchema } from "./track-ids-schema";

export class TrackIdsStore extends BaseStore<"trackIds"> {
  protected readonly sliceKey = "trackIds";
  protected readonly stateSchema = TrackIdsSchema;

  getActiveTrackIds(): TrackIds {
    return this.getState();
  }

  setActiveTrackIds(activeTrackIds: TrackIds): void {
    const validated = TrackIdsSchema.parse(activeTrackIds);
    this.setAppState(
      produce<AppState>((state) => {
        state.trackIds = validated;
      }),
    );
  }
}
