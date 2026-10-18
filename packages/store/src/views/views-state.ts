import { z } from "zod";
import { DEFAULT_VIEW_ID } from "./views-schema";

/**
 * Schema for the active view identifier shared with other components.
 * View lists, names, and component-owned configuration are not stored here.
 * Controllers manage the dirty flag and component-owned view configuration.
 *
 * @example
 * const viewsState: ViewsState = {
 *   activeView: "view-1",
 *   dirty: false
 * };
 */
export const ViewsStateSchema = z.object({
	activeView: z.string().min(1),
	dirty: z.boolean().default(false),
});

/**
 * State for the active view identifier and controller-managed dirty status.
 */
export type ViewsState = z.infer<typeof ViewsStateSchema>;

/**
 * Initial state with the built-in view active and no changes.
 */
export const initialViewsState: ViewsState = {
	activeView: DEFAULT_VIEW_ID,
	dirty: false,
};
