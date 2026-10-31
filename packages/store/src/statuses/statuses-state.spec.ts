import { ParentStatusSchema, SubStatusSchema } from "@fedex/prism-contracts";
import { describe, expect, test } from "vitest";
import { initialStatusesState, StatusesStateSchema } from "./statuses-state";

describe("StatusesStateSchema", () => {
  test("allows no selections as an empty array", () => {
    expect(StatusesStateSchema.parse({ activeStatuses: [] })).toEqual({
      activeStatuses: [],
      dirty: false,
    });
  });

  test.each([
    { activeStatuses: ["LABEL_CREATED"] },
    {
      activeStatuses: ["LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP", "EXCEPTION:DAMAGED_PACKAGE"],
    },
    {
      activeStatuses: [
        "LABEL_CREATED",
        "LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
        "EXCEPTION",
        "EXCEPTION:DAMAGED_PACKAGE",
      ],
    },
    {
      activeStatuses: [
        "LABEL_CREATED:SHIPMENT_INFORMATION_RECEIVED_BY_CARRIER",
        "LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
        "LABEL_CREATED:LABEL_EXPIRING_SOON",
      ],
    },
  ])("preserves independent selections without expansion or collapse: %j", (state) => {
    expect(StatusesStateSchema.parse(state)).toEqual({
      ...state,
      dirty: false,
    });
  });

  test("allows every parent and child to be selected together", () => {
    const state = {
      activeStatuses: [...ParentStatusSchema.options, ...SubStatusSchema.options],
    };

    expect(StatusesStateSchema.parse(state)).toEqual({
      ...state,
      dirty: false,
    });
  });

  test.each([true, false])("preserves explicitly supplied dirty=%s", (dirty) => {
    const state = { activeStatuses: ["LABEL_CREATED"], dirty };
    expect(StatusesStateSchema.parse(state)).toEqual(state);
  });

  test("defaults undefined dirty to false without modifying input", () => {
    const state = { activeStatuses: ["LABEL_CREATED"], dirty: undefined };

    expect(StatusesStateSchema.parse(state)).toEqual({
      activeStatuses: ["LABEL_CREATED"],
      dirty: false,
    });
    expect(state.dirty).toBeUndefined();
  });

  test.each([null, "true", "false", 0, 1, {}, []])(
    "rejects non-boolean dirty values: %j",
    (dirty) => {
      const result = StatusesStateSchema.safeParse({
        activeStatuses: [],
        dirty,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([expect.objectContaining({ path: ["dirty"] })]),
        );
      }
    },
  );

  test.each([
    {},
    { activeStatuses: null },
    { activeStatuses: "LABEL_CREATED" },
    { activeStatuses: ["UNKNOWN"] },
    { activeStatuses: ["LABEL_CREATED", "EXCEPTION:LABEL_EXPIRED"] },
    { activeStatuses: [{ status: "LABEL_CREATED", selected: true }] },
  ])("rejects invalid selections: %j", (state) => {
    expect(StatusesStateSchema.safeParse(state).success).toBe(false);
  });

  test("starts with no statuses selected", () => {
    expect(StatusesStateSchema.parse(initialStatusesState)).toEqual({
      activeStatuses: [],
      dirty: false,
    });
  });
});
