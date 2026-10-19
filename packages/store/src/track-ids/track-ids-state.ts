import { z } from "zod";
import { TrackIdsSchema } from "./track-ids-schema";

export const TrackIdsState = z.object({
  activeStatuses: z
    .array(TrackIdsSchema)
    .refine((trackIds) => new Set(trackIds).size === trackIds.length, {
      message: "TrackIds must be unique",
    }),
  dirty: z.boolean().default(false),
});
