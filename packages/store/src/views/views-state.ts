import { z } from "zod";
import { DEFAULT_VIEW_ID, ViewSchema } from "./views-schema";

/**
 * Schema for custom view metadata and the current view identifier.
 * Custom identifiers must be unique, but may use the built-in identifier.
 * The current identifier need not reference a custom view.
 * Controllers manage the dirty flag and component-owned view configuration.
 *
 * @example
 * const viewsState: ViewsState = {
 *   custom: [{ id: "view-1", name: "My view" }],
 *   current: "view-1",
 *   dirty: false
 * };
 */
export const ViewsStateSchema = z.object({
	custom: z
		.array(ViewSchema)
		.refine(
			(views) => new Set(views.map((view) => view.id)).size === views.length,
			{ message: "View identifiers must be unique" },
		),
	current: z.string().min(1),
	dirty: z.boolean().default(false),
});

/**
 * State for custom view metadata, current selection, and controller-managed dirty status.
 */
export type ViewsState = z.infer<typeof ViewsStateSchema>;

/**
 * Initial state with no custom views, the built-in view selected, and no changes.
 */
export const initialViewsState: ViewsState = {
	custom: [],
	current: DEFAULT_VIEW_ID,
	dirty: false,
};
