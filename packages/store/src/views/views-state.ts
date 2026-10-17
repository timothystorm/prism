import { z } from "zod";
import { DEFAULT_VIEW_ID, ViewSchema } from "./views-schema";

/**
 * Schema for user-created views and the current and default view identifiers.
 * The built-in view is always available, even when created is empty.
 * Created identifiers must be unique and cannot use the built-in identifier.
 * Controllers manage the dirty flag and component-owned view configuration.
 *
 * @example
 * const viewsState: ViewsState = {
 *   created: [{ id: "view-1", name: "My view" }],
 *   current: "view-1",
 *   default: "default",
 *   dirty: false
 * };
 */
export const ViewsStateSchema = z
	.object({
		created: z
			.array(ViewSchema)
			.refine((views) => views.every((view) => view.id !== DEFAULT_VIEW_ID), {
				message: "Created views cannot use the built-in view identifier",
			})
			.refine(
				(views) => new Set(views.map((view) => view.id)).size === views.length,
				{ message: "View identifiers must be unique" },
			),
		current: z.string().min(1),
		default: z.string().min(1),
		dirty: z.boolean().default(false),
	})
	.refine(
		(state) =>
			state.current === DEFAULT_VIEW_ID ||
			state.created.some((view) => view.id === state.current),
		{ message: "Current view must be available", path: ["current"] },
	)
	.refine(
		(state) =>
			state.default === DEFAULT_VIEW_ID ||
			state.created.some((view) => view.id === state.default),
		{ message: "Default view must be available", path: ["default"] },
	);

/**
 * Types for views state.
 */
export type ViewsState = z.infer<typeof ViewsStateSchema>;

/**
 * Initial state for views.
 */
export const initialViewsState: ViewsState = {
	created: [],
	current: DEFAULT_VIEW_ID,
	default: DEFAULT_VIEW_ID,
	dirty: false,
};
