import { z } from "zod";

/**
 * Identifier for the built-in view, selected in the initial views state.
 */
export const DEFAULT_VIEW_ID = "default";

/**
 * Schema for view metadata. View configuration belongs to individual components.
 *
 * @example
 * const view: View = { id: "view-1", name: "My view" };
 */
export const ViewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

/**
 * Types for view metadata.
 */
export type View = z.infer<typeof ViewSchema>;
