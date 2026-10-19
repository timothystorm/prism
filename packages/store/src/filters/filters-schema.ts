import { z } from "zod";
import { DateRangeSchema } from "../common/date-schema";
import { LocationCriterionSchema } from "../common/location-schema";
import { TimeRangeSchema } from "../common/time-schema";

/**
 * A schemas for shipment filters, which can be used to filter shipments based on various criteria such as dates,
 * locations, and other attributes. Each filter type has its own specific criteria, and the schemas uses a discriminated
 * union to differentiate between the different filter types.
 */
export const FilterSchema = z.discriminatedUnion("type", [
  /**
   * @example
   * {
   *   "type": "SHIPMENT:COMMIT_DATE",
   *   "criteria": {
   *     "start": "2023-01-01",
   *     "end": "2023-01-31"
   *   }
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:COMMIT_DATE"),
      criteria: DateRangeSchema,
    })
    .describe("Commitment calendar-date range for the shipment (YYYY-MM-DD)"),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:DELIVERED_DATE",
   *   "criteria": {
   *     "start": "2023-01-01",
   *     "end": "2023-01-31"
   *   }
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:DELIVERED_DATE"),
      criteria: DateRangeSchema,
    })
    .describe("Delivery calendar-date range for the shipment (YYYY-MM-DD)"),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:EST_DELIVERY_DATE",
   *   "criteria": {
   *     "start": "2023-01-01",
   *     "end": "2023-01-31"
   *   }
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:EST_DELIVERY_DATE"),
      criteria: DateRangeSchema,
    })
    .describe("Estimated delivery calendar-date range for the shipment (YYYY-MM-DD)"),

  z
    .object({
      type: z.literal("SHIPMENT:EST_DELIVERY_TIME"),
      criteria: TimeRangeSchema,
    })
    .describe(
      "Estimated delivery time range for the shipment in 24 hour clock time - ex. 08:00 to 17:00",
    ),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:SHIP_DATE",
   *   "criteria": {
   *     "start": "2023-01-01",
   *     "end": "2023-01-31"
   *   }
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:SHIP_DATE"),
      criteria: DateRangeSchema,
    })
    .describe("Ship calendar-date range for the shipment (YYYY-MM-DD)"),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:TENDERED_DATE",
   *   "criteria": {
   *     "start": "2023-01-01",
   *     "end": "2023-01-31"
   *   }
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:TENDERED_DATE"),
      criteria: DateRangeSchema,
    })
    .describe("Tendered calendar-date range for the shipment (YYYY-MM-DD)"),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:DELIVERY_PREDICTION",
   *   "criteria": "ON_TIME"
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:DELIVERY_PREDICTION"),
      criteria: z.enum(["EARLY", "DELAYED", "ON_TIME"]),
    })
    .describe("Delivery prediction for the shipment, can be EARLY, DELAYED or ON_TIME"),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:DESTINATION",
   *   "criteria": [
   *     {
   *       "type": "CITY",
   *       "value": "Chicago"
   *     },
   *     {
   *       "type": "CITY",
   *       "value": "Springfield"
   *     },
   *     {
   *       "type": "STATE_OR_PROVINCE",
   *       "value": "IL"
   *     }
   *   ]
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:DESTINATION"),
      criteria: z.array(LocationCriterionSchema).min(1),
    })
    .describe(
      "Destination location criteria for the shipment, can be one or more of ADDRESS, CITY, STATE_OR_PROVINCE, COUNTRY_OR_TERRITORY, POSTAL_CODE",
    ),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:GPS_DELIVERY_LOCATION",
   *   "criteria": true
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:GPS_DELIVERY_LOCATION"),
      criteria: z.boolean().default(false),
    })
    .describe("Whether the shipment has GPS delivery location or not"),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:INVOICE_NUMBER",
   *   "criteria": ["INV-12345", "INV-67890"]
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:INVOICE_NUMBER"),
      criteria: z.array(z.string()).min(1),
    })
    .describe("Filter shipments by invoice number(s)"),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:LAST_LOCATION",
   *   "criteria": ["Chicago", "Springfield"]
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:LAST_LOCATION"),
      criteria: z.array(z.string()).min(1),
    })
    .describe("Filter shipments by last known location(s)"),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:NUMBER_OF_ATTEMPTED_DELIVERIES",
   *   "criteria": 2
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:NUMBER_OF_ATTEMPTED_DELIVERIES"),
      criteria: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(99)]),
    })
    .describe(
      "Filter shipments by number of attempted deliveries, can be 1, 2, 3 or 99 (for more than 3 attempts)",
    ),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:ORIGIN",
   *   "criteria": [
   *     {
   *       "type": "CITY",
   *       "value": "Chicago"
   *     },
   *     {
   *       "type": "CITY",
   *       "value": "Springfield"
   *     },
   *     {
   *       "type": "STATE_OR_PROVINCE",
   *       "value": "IL"
   *     }
   *   ]
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:ORIGIN"),
      criteria: z.array(LocationCriterionSchema).min(1),
    })
    .describe(
      "Origin location criteria for the shipment, can be one or more of ADDRESS, CITY, STATE_OR_PROVINCE, COUNTRY_OR_TERRITORY, POSTAL_CODE",
    ),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:PARTNER_CARRIER_NUMBER",
   *   "criteria": ["123456789", "987654321"]
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:PARTNER_CARRIER_NUMBER"),
      criteria: z.array(z.string()).min(1),
    })
    .describe("Filter shipments by partner carrier number(s)"),

  /**
   * @TODO Add known services types enum for known services types, but allow for unknown services types as well
   * @example
   * {
   *   "type": "SHIPMENT:SERVICE_TYPE",
   *   "criteria": ["GROUND", "EXPRESS"]
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:SERVICE_TYPE"),
      criteria: z.array(z.string()).min(1),
    })
    .describe("Filter shipments by services type(s)"),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:SHIPPER_REFERENCE",
   *   "criteria": ["REF-12345", "REF-67890"]
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:SHIPPER_REFERENCE"),
      criteria: z.array(z.string()).min(1),
    })
    .describe("Filter shipments by shipper reference(s)"),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:SIGNATURE_AVAILABLE",
   *   "criteria": true
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:SIGNATURE_AVAILABLE"),
      criteria: z.boolean().default(false),
    })
    .describe("Whether the shipment has signature available or not"),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:TIME_IN_NETWORK",
   *   "criteria": {
   *     "start": "08:00",
   *     "end": "17:00"
   *   }
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:TIME_IN_NETWORK"),
      criteria: TimeRangeSchema,
    })
    .describe("Time in network range for the shipment in 24 hour clock time - ex. 08:00 to 17:00"),

  /**
   * @example
   * {
   *   "type": "SHIPPER:SHIPPER_COMPANY",
   *   "criteria": ["Acme Corp", "Globex Inc"]
   * }
   */
  z
    .object({
      type: z.literal("SHIPPER:SHIPPER_COMPANY"),
      criteria: z.array(z.string()).min(1),
    })
    .describe("Filter shipments by shipper company name(s)"),

  /**
   * @example
   * {
   *   "type": "SHIPMENT:SHIPPER_NAME",
   *   "criteria": ["John Doe", "Jane Smith"]
   * }
   */
  z
    .object({
      type: z.literal("SHIPMENT:SHIPPER_NAME"),
      criteria: z.array(z.string()).min(1),
    })
    .describe("Filter shipments by shipper name(s)"),

  /**
   * @example
   * {
   *   "type": "RECIPIENT:RECEIVED_BY",
   *   "criteria": ["Alice Johnson", "Bob Brown"]
   * }
   */
  z
    .object({
      type: z.literal("RECIPIENT:RECEIVED_BY"),
      criteria: z.array(z.string()).min(1),
    })
    .describe("Filter shipments by recipient received by name(s)"),

  /**
   * @example
   * {
   *   "type": "RECIPIENT:RECIPIENT_COMPANY",
   *   "criteria": ["Initech", "Umbrella Corp"]
   * }
   */
  z
    .object({
      type: z.literal("RECIPIENT:RECIPIENT_COMPANY"),
      criteria: z.array(z.string()).min(1),
    })
    .describe("Filter shipments by recipient company name(s)"),

  /**
   * @example
   * {
   *   "type": "RECIPIENT:RECIPIENT_CONTACT_NAME",
   *   "criteria": ["Charlie Davis", "Dana Lee"]
   * }
   */
  z
    .object({
      type: z.literal("RECIPIENT:RECIPIENT_CONTACT_NAME"),
      criteria: z.array(z.string()).min(1),
    })
    .describe("Filter shipments by recipient contact name(s)"),
]);

export type Filter = z.infer<typeof FilterSchema>;
