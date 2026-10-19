import { z } from "zod";

export const TrackIdsSchema = z.array(z.string()).optional();
export type TrackIds = z.infer<typeof TrackIdsSchema>;

export const initialTrackIds: TrackIds = [];
