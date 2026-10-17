import { describe, expect, test } from "vitest";
import {
	ParentStatusSchema,
	StatusSchema,
	SubStatusSchema,
} from "./statuses-schema";

const cases = [
	{
		status: "LABEL_CREATED",
		subStatuses: [
			"SHIPMENT_INFORMATION_RECEIVED_BY_CARRIER",
			"WAITING_FOR_CARRIER_PICKUP",
			"LABEL_EXPIRING_SOON",
		],
	},
	{
		status: "IN_POSSESSION_WITH_CARRIER",
		subStatuses: [
			"PICKED_UP_BY_CARRIER",
			"DROPPED_OFF_AT_CARRIER_FACILITY",
			"RECEIVED_AFTER_CARRIER_CUT_OFF",
		],
	},
	{
		status: "IN_TRANSIT",
		subStatuses: [
			"AT_ORIGIN_FACILITY",
			"AT_DESTINATION_FACILITY",
			"ARRIVED_AT_TRANSIT_HUB",
			"DEPARTED_TRANSIT_HUB",
			"DEPARTED_DESTINATION_SORT_FACILITY",
			"PROCESSING_AT_CUSTOMS",
			"CLEARED_CUSTOMS",
			"TRANSFERRED_TO_LOCAL_CARRIER",
			"DELIVERY_OPTION_REQUESTED",
		],
	},
	{
		status: "DELAYED",
		subStatuses: [
			"DELAY_BEYOND_OUR_CONTROL",
			"SEVERE_WEATHER_DELAY",
			"CUSTOMS_PROCESSING_DELAY",
			"CARRIER_OPERATIONAL_DELAY",
			"MISSED_SCHEDULED_TRANSIT",
			"HELD_DUE_TO_PAYMENT_REQUIRED",
			"PLANE_ARRIVED_LATE_AT_HUB_OR_RAMP",
		],
	},
	{
		status: "EXCEPTION",
		subStatuses: [
			"DAMAGED_PACKAGE",
			"LOST_IN_TRANSIT",
			"REROUTED_SHIPMENT",
			"SECURITY_HOLD",
			"RESTRICTED_ITEM",
			"FAILED_DELIVERY_ATTEMPT_NO_RECIPIENT_AVAILABLE",
			"FAILED_DELIVERY_ATTEMPT_BUSINESS_CLOSED",
			"IMPROPER_MISSING_REGULATORY_PAPERWORK",
			"INCORRECT_ADDRESS_NEEDS_CORRECTION",
			"RETURN_TO_SENDER_INITIATED",
			"PACKAGE_REFUSED_BY_RECIPIENT",
		],
	},
	{
		status: "OUT_FOR_DELIVERY",
		subStatuses: [
			"OUT_FOR_DELIVERY_RESIDENTIAL",
			"OUT_FOR_DELIVERY_BUSINESS",
			"OUT_FOR_DELIVERY_LOCKER_PICKUP_POINT",
		],
	},
	{
		status: "DELIVERED",
		subStatuses: [
			"DELIVERED_TO_RECIPIENT",
			"DELIVERED_TO_MAILROOM_RECEPTION",
			"LEFT_AT_DOORSTEP",
			"DELIVERED_TO_PARCEL_LOCKER",
			"SIGNED_FOR_BY_RECIPIENT",
		],
	},
	{
		status: "AVAILABLE_FOR_PICKUP",
		subStatuses: [
			"AVAILABLE_AT_CARRIER_PICKUP_LOCATION",
			"AVAILABLE_AT_RETAIL_PARTNER_LOCATION",
			"AVAILABLE_AT_PARCEL_LOCKER",
		],
	},
	{
		status: "CANCELLED",
		subStatuses: ["LABEL_EXPIRED", "SHIPPER_CANCELLED_THE_SHIPMENT"],
	},
];

describe("StatusSchema", () => {
	test.each(cases)("accepts parent identifier $status", ({ status }) => {
		expect(ParentStatusSchema.parse(status)).toBe(status);
		expect(StatusSchema.parse(status)).toBe(status);
		expect(SubStatusSchema.safeParse(status).success).toBe(false);
	});

	test.each(cases)(
		"accepts qualified children of $status, but not bare child names",
		({ status, subStatuses }) => {
			for (const subStatus of subStatuses) {
				const identifier = `${status}:${subStatus}`;
				expect(SubStatusSchema.parse(identifier)).toBe(identifier);
				expect(StatusSchema.parse(identifier)).toBe(identifier);
				expect(ParentStatusSchema.safeParse(identifier).success).toBe(false);
				expect(StatusSchema.safeParse(subStatus).success).toBe(false);
			}
		},
	);

	test.each(cases)(
		"rejects children under the wrong parent $status",
		({ status }) => {
			const subStatus =
				status === "CANCELLED" ? "DAMAGED_PACKAGE" : "LABEL_EXPIRED";
			expect(StatusSchema.safeParse(`${status}:${subStatus}`).success).toBe(
				false,
			);
		},
	);

	test.each([
		null,
		undefined,
		42,
		true,
		"",
		"UNKNOWN",
		"LABEL_CREATED:UNKNOWN",
		"UNKNOWN:DAMAGED_PACKAGE",
		"EXCEPTION:DAMAGED_PACKAGE:UNKNOWN",
		{ status: "LABEL_CREATED", selected: true, subStatuses: [] },
	])(
		"rejects invalid identifiers and the previous object format: %j",
		(input) => {
			expect(StatusSchema.safeParse(input).success).toBe(false);
		},
	);
});
