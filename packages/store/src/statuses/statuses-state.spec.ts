import { describe, expect, test } from "vitest";
import { ParentStatusSchema, SubStatusSchema } from "./statuses-schema";
import { initialStatusesState, StatusesStateSchema } from "./statuses-state";

describe("StatusesStateSchema", () => {
	test("allows no selections as an empty array", () => {
		expect(StatusesStateSchema.parse({ selectedStatuses: [] })).toEqual({
			selectedStatuses: [],
			dirty: false,
		});
	});

	test.each([
		{ selectedStatuses: ["LABEL_CREATED"] },
		{
			selectedStatuses: [
				"LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
				"EXCEPTION:DAMAGED_PACKAGE",
			],
		},
		{
			selectedStatuses: [
				"LABEL_CREATED",
				"LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
				"EXCEPTION",
				"EXCEPTION:DAMAGED_PACKAGE",
			],
		},
		{
			selectedStatuses: [
				"LABEL_CREATED:SHIPMENT_INFORMATION_RECEIVED_BY_CARRIER",
				"LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
				"LABEL_CREATED:LABEL_EXPIRING_SOON",
			],
		},
	])(
		"preserves independent selections without expansion or collapse: %j",
		(state) => {
			expect(StatusesStateSchema.parse(state)).toEqual({
				...state,
				dirty: false,
			});
		},
	);

	test("allows every parent and child to be selected together", () => {
		const state = {
			selectedStatuses: [
				...ParentStatusSchema.options,
				...SubStatusSchema.options,
			],
		};

		expect(StatusesStateSchema.parse(state)).toEqual({
			...state,
			dirty: false,
		});
	});

	test.each([true, false])(
		"preserves explicitly supplied dirty=%s",
		(dirty) => {
			const state = { selectedStatuses: ["LABEL_CREATED"], dirty };
			expect(StatusesStateSchema.parse(state)).toEqual(state);
		},
	);

	test("defaults undefined dirty to false without modifying input", () => {
		const state = { selectedStatuses: ["LABEL_CREATED"], dirty: undefined };

		expect(StatusesStateSchema.parse(state)).toEqual({
			selectedStatuses: ["LABEL_CREATED"],
			dirty: false,
		});
		expect(state.dirty).toBeUndefined();
	});

	test.each([null, "true", "false", 0, 1, {}, []])(
		"rejects non-boolean dirty values: %j",
		(dirty) => {
			const result = StatusesStateSchema.safeParse({
				selectedStatuses: [],
				dirty,
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ path: ["dirty"] }),
					]),
				);
			}
		},
	);

	test.each([
		{},
		{ selectedStatuses: null },
		{ selectedStatuses: "LABEL_CREATED" },
		{ selectedStatuses: ["UNKNOWN"] },
		{ selectedStatuses: ["LABEL_CREATED", "EXCEPTION:LABEL_EXPIRED"] },
		{ selectedStatuses: [{ status: "LABEL_CREATED", selected: true }] },
	])("rejects invalid selections: %j", (state) => {
		expect(StatusesStateSchema.safeParse(state).success).toBe(false);
	});

	test("starts with no statuses selected", () => {
		expect(StatusesStateSchema.parse(initialStatusesState)).toEqual({
			selectedStatuses: [],
			dirty: false,
		});
	});
});
