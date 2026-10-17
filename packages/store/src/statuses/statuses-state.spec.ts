import { describe, expect, test } from "vitest";
import { ParentStatusSchema, SubStatusSchema } from "./statuses-schema";
import { initialStatusesState, StatusesStateSchema } from "./statuses-state";

describe("StatusesStateSchema", () => {
	test("allows no selections as an empty array", () => {
		expect(StatusesStateSchema.parse({ selectedStatuses: [] })).toEqual({
			selectedStatuses: [],
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
			expect(StatusesStateSchema.parse(state)).toEqual(state);
		},
	);

	test("allows every parent and child to be selected together", () => {
		const state = {
			selectedStatuses: [
				...ParentStatusSchema.options,
				...SubStatusSchema.options,
			],
		};

		expect(StatusesStateSchema.parse(state)).toEqual(state);
	});

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
		});
	});
});
