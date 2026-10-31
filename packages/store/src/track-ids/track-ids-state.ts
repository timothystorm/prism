import { z } from "zod";
import { TrackIdsSchema } from "./track-ids-schema";

/**
 * Standalone wrapper not wired into AppState or TrackIdsStore.
 * Its activeStatuses field contains arrays of tracking-ID selections, not a flat ID list.
 * Do not use this object shape for live tracking snapshots: those use TrackIdsSchema
 * directly and do not contain dirty metadata.
 */
export const TrackIdsState = z.object({
  activeStatuses: z
    .array(TrackIdsSchema)
    .refine((trackIds) => new Set(trackIds).size === trackIds.length, {
      message: "TrackIds must be unique",
    }),
  dirty: z.boolean().default(false),
});
