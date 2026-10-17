import { describe, expect, test } from "vitest";
import { ZodError } from "zod";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "../app-state";
import {
	ParentStatusSchema,
	type Status,
	SubStatusSchema,
} from "./statuses-schema";
import { StatusesStore } from "./statuses-store";

function createStatusesStore() {
	const store = createStore<AppState>(() => ({ ...initialAppState }));
	const actions = new StatusesStore(store.getState, store.setState);
	return { store, actions };
}

describe("StatusesStore", () => {
	test.each(["state", "selectedStatuses"] as const)(
		"updates %s without changing earlier snapshots, unrelated state, or retaining input references",
		(property) => {
			const { store, actions } = createStatusesStore();
			const initial = store.getState();
			const selectedStatuses: Status[] = [
				"LABEL_CREATED",
				"LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
				"EXCEPTION:DAMAGED_PACKAGE",
			];
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			if (property === "state") {
				actions.state = { selectedStatuses };
			} else {
				actions.selectedStatuses = selectedStatuses;
			}

			expect(actions.state).toBe(store.getState().statuses);
			expect(actions.selectedStatuses).toBe(
				store.getState().statuses.selectedStatuses,
			);
			expect(actions.selectedStatuses).toEqual([
				"LABEL_CREATED",
				"LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
				"EXCEPTION:DAMAGED_PACKAGE",
			]);
			expect(updates).toEqual([
				{
					...initial,
					statuses: {
						selectedStatuses: [
							"LABEL_CREATED",
							"LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
							"EXCEPTION:DAMAGED_PACKAGE",
						],
					},
				},
			]);
			expect(initial.statuses.selectedStatuses).toEqual([]);
			expect(store.getState().metrics).toBe(initial.metrics);
			expect(store.getState().columns).toBe(initial.columns);

			selectedStatuses.push("DELIVERED");
			expect(actions.selectedStatuses).toEqual([
				"LABEL_CREATED",
				"LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
				"EXCEPTION:DAMAGED_PACKAGE",
			]);
		},
	);

	test.each(["state", "selectedStatuses"] as const)(
		"clears selections through %s",
		(property) => {
			const { store, actions } = createStatusesStore();
			actions.selectedStatuses = ["LABEL_CREATED"];
			const initial = store.getState();
			const updates: AppState[] = [];
			store.subscribe((state) => updates.push(state));

			if (property === "state") {
				actions.state = { selectedStatuses: [] };
			} else {
				actions.selectedStatuses = [];
			}

			expect(actions.selectedStatuses).toEqual([]);
			expect(initial.statuses.selectedStatuses).toEqual(["LABEL_CREATED"]);
			expect(updates).toHaveLength(1);
			expect(updates[0]?.statuses.selectedStatuses).toEqual([]);
		},
	);

	test("preserves all children without implicitly selecting their parent", () => {
		const { actions } = createStatusesStore();
		actions.selectedStatuses = [
			"LABEL_CREATED:SHIPMENT_INFORMATION_RECEIVED_BY_CARRIER",
			"LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
			"LABEL_CREATED:LABEL_EXPIRING_SOON",
		];

		expect(actions.selectedStatuses).toEqual([
			"LABEL_CREATED:SHIPMENT_INFORMATION_RECEIVED_BY_CARRIER",
			"LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
			"LABEL_CREATED:LABEL_EXPIRING_SOON",
		]);
	});

	test("allows every status to be selected without controller restrictions", () => {
		const { actions } = createStatusesStore();
		const selectedStatuses = [
			...ParentStatusSchema.options,
			...SubStatusSchema.options,
		];

		actions.selectedStatuses = selectedStatuses;

		expect(actions.selectedStatuses).toEqual(selectedStatuses);
	});

	test.each(["state", "selectedStatuses"] as const)(
		"rejects invalid %s writes without changing state or notifying subscribers",
		(property) => {
			for (const selectedStatuses of [
				null,
				"LABEL_CREATED",
				["UNKNOWN"],
				["LABEL_CREATED", "EXCEPTION:LABEL_EXPIRED"],
				[{ status: "LABEL_CREATED", selected: true }],
			]) {
				const { store, actions } = createStatusesStore();
				actions.selectedStatuses = ["DELIVERED"];
				const initial = store.getState();
				let notifications = 0;
				store.subscribe(() => {
					notifications += 1;
				});
				const value =
					property === "state" ? { selectedStatuses } : selectedStatuses;

				expect(() => Reflect.set(actions, property, value)).toThrow(ZodError);
				expect(store.getState()).toBe(initial);
				expect(actions.selectedStatuses).toEqual(["DELIVERED"]);
				expect(notifications).toBe(0);
			}
		},
	);

	test.each([null, {}])(
		"rejects malformed whole-state replacements: %j",
		(state) => {
			const { store, actions } = createStatusesStore();
			const initial = store.getState();

			expect(() => Reflect.set(actions, "state", state)).toThrow(ZodError);
			expect(store.getState()).toBe(initial);
		},
	);
});
