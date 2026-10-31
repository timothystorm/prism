import { ParentStatusSchema, type Status, SubStatusSchema } from "@fedex/prism-contracts";
import { describe, expect, expectTypeOf, test } from "vitest";
import { ZodError } from "zod";
import { createStore } from "zustand/vanilla";
import { type AppState, initialAppState } from "../app-state";
import { StatusesStore } from "../index";

function createStatusesStore() {
  const store = createStore<AppState>(() => ({ ...initialAppState }));
  const actions = new StatusesStore(store.getState, store.setState);
  return { store, actions };
}

describe("StatusesStore", () => {
  describe.each([false, true])("addActiveStatuses with dirty=%s", (dirty) => {
    test.each(["LABEL_CREATED", "LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP"] as const)(
      "appends %s without expanding or collapsing selections",
      (status) => {
        const { store, actions } = createStatusesStore();
        actions.setState({ activeStatuses: ["DELIVERED"], dirty });
        const initial = store.getState();
        const updates: AppState[] = [];
        store.subscribe((state) => updates.push(state));

        const result = actions.addActiveStatuses(status);

        expect(result).toBe(actions.getActiveStatuses());
        expect(actions.getState()).toEqual({
          activeStatuses: ["DELIVERED", status],
          dirty,
        });
        expect(initial.statuses).toEqual({
          activeStatuses: ["DELIVERED"],
          dirty,
        });
        expect(store.getState().columns).toBe(initial.columns);
        expect(store.getState().metrics).toBe(initial.metrics);
        expect(store.getState().filters).toBe(initial.filters);
        expect(updates).toHaveLength(1);
      },
    );

    test("ignores an already selected status without notifying subscribers", () => {
      const { store, actions } = createStatusesStore();
      actions.setState({
        activeStatuses: ["LABEL_CREATED", "DELIVERED"],
        dirty,
      });
      const initial = store.getState();
      const updates: AppState[] = [];
      store.subscribe((state) => updates.push(state));

      const result = actions.addActiveStatuses("LABEL_CREATED");

      expect(result).toBe(initial.statuses.activeStatuses);
      expect(store.getState()).toBe(initial);
      expect(updates).toHaveLength(0);
    });
  });

  test.each(["UNKNOWN", "", null, 1])(
    "rejects adding invalid status %j without changing state or notifying",
    (status) => {
      const { store, actions } = createStatusesStore();
      const initial = store.getState();
      const updates: AppState[] = [];
      store.subscribe((state) => updates.push(state));

      expect(() => Reflect.apply(actions.addActiveStatuses, actions, [status])).toThrow(ZodError);
      expect(store.getState()).toBe(initial);
      expect(updates).toHaveLength(0);
    },
  );

  test.each(["setState", "setActiveStatuses"] as const)(
    "updates %s without changing earlier snapshots, unrelated state, or retaining input references",
    (property) => {
      const { store, actions } = createStatusesStore();
      const initial = store.getState();
      const activeStatuses: Status[] = [
        "LABEL_CREATED",
        "LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
        "EXCEPTION:DAMAGED_PACKAGE",
      ];
      const updates: AppState[] = [];
      store.subscribe((state) => updates.push(state));

      if (property === "setState") {
        actions.setState({ activeStatuses, dirty: false });
      } else {
        actions.setActiveStatuses(activeStatuses);
      }

      expect(actions.getState()).toBe(store.getState().statuses);
      expect(actions.getActiveStatuses()).toBe(store.getState().statuses.activeStatuses);
      expectTypeOf(actions.getActiveStatuses()).toEqualTypeOf<Status[]>();
      expect(actions.getActiveStatuses()).toEqual([
        "LABEL_CREATED",
        "LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
        "EXCEPTION:DAMAGED_PACKAGE",
      ]);
      expect(updates).toEqual([
        {
          ...initial,
          statuses: {
            dirty: false,
            activeStatuses: [
              "LABEL_CREATED",
              "LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
              "EXCEPTION:DAMAGED_PACKAGE",
            ],
          },
        },
      ]);
      expect(initial.statuses.activeStatuses).toEqual([]);
      expect(store.getState().metrics).toBe(initial.metrics);
      expect(store.getState().columns).toBe(initial.columns);

      activeStatuses.push("DELIVERED");
      expect(actions.getActiveStatuses()).toEqual([
        "LABEL_CREATED",
        "LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
        "EXCEPTION:DAMAGED_PACKAGE",
      ]);
    },
  );

  test.each(["setState", "setActiveStatuses"] as const)(
    "clears selections through %s",
    (property) => {
      const { store, actions } = createStatusesStore();
      actions.setActiveStatuses(["LABEL_CREATED"]);
      const initial = store.getState();
      const updates: AppState[] = [];
      store.subscribe((state) => updates.push(state));

      if (property === "setState") {
        actions.setState({ activeStatuses: [], dirty: false });
      } else {
        actions.setActiveStatuses([]);
      }

      expect(actions.getActiveStatuses()).toEqual([]);
      expect(initial.statuses.activeStatuses).toEqual(["LABEL_CREATED"]);
      expect(updates).toHaveLength(1);
      expect(updates[0]?.statuses.activeStatuses).toEqual([]);
    },
  );

  test("preserves all children without implicitly selecting their parent", () => {
    const { actions } = createStatusesStore();
    actions.setActiveStatuses([
      "LABEL_CREATED:SHIPMENT_INFORMATION_RECEIVED_BY_CARRIER",
      "LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
      "LABEL_CREATED:LABEL_EXPIRING_SOON",
    ]);

    expect(actions.getActiveStatuses()).toEqual([
      "LABEL_CREATED:SHIPMENT_INFORMATION_RECEIVED_BY_CARRIER",
      "LABEL_CREATED:WAITING_FOR_CARRIER_PICKUP",
      "LABEL_CREATED:LABEL_EXPIRING_SOON",
    ]);
  });

  test.each([true, false])(
    "leaves dirty=%s unchanged when selecting or clearing statuses",
    (dirty) => {
      const { store, actions } = createStatusesStore();
      actions.setState({ activeStatuses: [], dirty });
      const initial = store.getState();

      actions.setActiveStatuses(["LABEL_CREATED"]);
      expect(actions.getState()).toEqual({
        activeStatuses: ["LABEL_CREATED"],
        dirty,
      });

      actions.setActiveStatuses([]);
      expect(actions.getState()).toEqual({ activeStatuses: [], dirty });
      expect(initial.statuses).toEqual({ activeStatuses: [], dirty });
    },
  );

  test("updates dirty through state replacement and notifies subscribers without changing selections", () => {
    const { store, actions } = createStatusesStore();
    actions.setActiveStatuses(["LABEL_CREATED"]);
    const initial = store.getState();
    const updates: AppState[] = [];
    store.subscribe((state) => updates.push(state));

    actions.setState({ activeStatuses: ["LABEL_CREATED"], dirty: true });

    expect(actions.getState()).toEqual({
      activeStatuses: ["LABEL_CREATED"],
      dirty: true,
    });
    expect(initial.statuses).toEqual({
      activeStatuses: ["LABEL_CREATED"],
      dirty: false,
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]?.statuses.dirty).toBe(true);

    actions.setState({ activeStatuses: ["LABEL_CREATED"], dirty: false });
    expect(actions.getState().dirty).toBe(false);
    expect(updates).toHaveLength(2);
    expect(updates[1]?.statuses.dirty).toBe(false);
  });

  test.each([null, "true", 1])(
    "rejects invalid dirty=%j without changing state or notifying subscribers",
    (dirty) => {
      const { store, actions } = createStatusesStore();
      actions.setState({ activeStatuses: ["DELIVERED"], dirty: true });
      const initial = store.getState();
      let notifications = 0;
      store.subscribe(() => {
        notifications += 1;
      });

      expect(() =>
        Reflect.apply(actions.setState, actions, [
          {
            activeStatuses: ["LABEL_CREATED"],
            dirty,
          },
        ]),
      ).toThrow(ZodError);

      expect(store.getState()).toBe(initial);
      expect(notifications).toBe(0);
    },
  );

  test("allows every status to be selected without controller restrictions", () => {
    const { actions } = createStatusesStore();
    const activeStatuses = [...ParentStatusSchema.options, ...SubStatusSchema.options];

    actions.setActiveStatuses(activeStatuses);

    expect(actions.getActiveStatuses()).toEqual(activeStatuses);
  });

  test.each(["setState", "setActiveStatuses"] as const)(
    "rejects invalid %s writes without changing state or notifying subscribers",
    (property) => {
      for (const activeStatuses of [
        null,
        "LABEL_CREATED",
        ["UNKNOWN"],
        ["LABEL_CREATED", "EXCEPTION:LABEL_EXPIRED"],
        [{ status: "LABEL_CREATED", selected: true }],
      ]) {
        const { store, actions } = createStatusesStore();
        actions.setActiveStatuses(["DELIVERED"]);
        const initial = store.getState();
        let notifications = 0;
        store.subscribe(() => {
          notifications += 1;
        });
        const value = property === "setState" ? { activeStatuses } : activeStatuses;

        expect(() => Reflect.apply(actions[property], actions, [value])).toThrow(ZodError);
        expect(store.getState()).toBe(initial);
        expect(actions.getActiveStatuses()).toEqual(["DELIVERED"]);
        expect(notifications).toBe(0);
      }
    },
  );

  test.each([null, {}])("rejects malformed whole-state replacements: %j", (state) => {
    const { store, actions } = createStatusesStore();
    const initial = store.getState();

    expect(() => Reflect.apply(actions.setState, actions, [state])).toThrow(ZodError);
    expect(store.getState()).toBe(initial);
  });
});
