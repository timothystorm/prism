import { z } from "zod";

/**
 * Optional flat tracking-ID selection. Strings are preserved verbatim; format, non-empty
 * values, and uniqueness are not enforced. Undefined is accepted without defaulting to [].
 */
export const TrackIdsSchema = z.array(z.string()).optional();
export type TrackIds = z.infer<typeof TrackIdsSchema>;

/** New stores start with an explicitly empty selection rather than an absent one. */
export const initialTrackIds: TrackIds = [];
