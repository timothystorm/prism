import {describe, expect, test} from 'vitest';
import {type AppState, initialAppState} from './app-state';
import {AppStore} from './app-store';

describe('AppStore', () => {
  describe('initialization and statistics-store integration', () => {
    test('starts with the configured initial application store', () => {
      const appStore = new AppStore();

      expect(appStore.state).toEqual(initialAppState);
      expect(appStore.statistics.state).toBe(appStore.state.statistics);
    });

    test('exposes a stable statistics store connected to the application store', () => {
      const appStore = new AppStore();
      const statistics = appStore.statistics;
      const initial = appStore.state;

      statistics.activeStatistic = 'exceptions';

      expect(appStore.statistics).toBe(statistics);
      expect(appStore.state.statistics.activeStatistic).toBe('exceptions');
      expect(statistics.state).toBe(appStore.state.statistics);
      expect(appStore.state).not.toBe(initial);
    });

    test('keeps updates isolated between application-store instances', () => {
      const first = new AppStore();
      const second = new AppStore();
      const secondInitial = second.state;

      first.statistics.activeStatistic = 'exceptions';

      expect(second.state).toBe(secondInitial);
      expect(second.state).toEqual(initialAppState);
      expect(first.state).not.toBe(second.state);
    });
  });

  describe('subscriptions', () => {
    test('emits the selected new and previous values only when the selection changes', () => {
      const appStore = new AppStore();
      const updates: Array<{
        value: AppState['statistics']['activeStatistic'];
        previousValue: AppState['statistics']['activeStatistic'];
      }> = [];
      appStore.subscribe(
          (state) => state.statistics.activeStatistic,
          (value, previousValue) => updates.push({value, previousValue}),
      );

      expect(updates).toEqual([]);

      appStore.statistics.activeStatistic = 'exceptions';
      appStore.statistics.loading = true;
      appStore.statistics.activeStatistic = 'label_created';

      expect(updates).toEqual([
        {
          value: 'exceptions',
          previousValue: initialAppState.statistics.activeStatistic,
        },
        {
          value: 'label_created',
          previousValue: 'exceptions'
        },
      ]);
    });

    test('supports selecting and observing the entire application store', () => {
      const appStore = new AppStore();
      const initial = appStore.state;
      const updates: Array<{ value: AppState; previousValue: AppState }> = [];
      appStore.subscribe(
          (state) => state,
          (value, previousValue) => updates.push({value, previousValue}),
      );

      appStore.statistics.activeStatistic = 'exceptions';

      expect(updates).toHaveLength(1);
      expect(updates[0]?.value).toBe(appStore.state);
      expect(updates[0]?.previousValue).toBe(initial);
    });

    test('unsubscribes a listener without disconnecting other listeners', () => {
      const appStore = new AppStore();
      const unsubscribedUpdates: Array<AppState['statistics']['activeStatistic']> = [];
      const activeUpdates: Array<AppState['statistics']['activeStatistic']> = [];
      const unsubscribe = appStore.subscribe(
          (state) => state.statistics.activeStatistic,
          (value) => unsubscribedUpdates.push(value),
      );
      appStore.subscribe(
          (state) => state.statistics.activeStatistic,
          (value) => activeUpdates.push(value),
      );

      appStore.statistics.activeStatistic = 'exceptions';
      unsubscribe();
      appStore.statistics.activeStatistic = 'label_created';

      expect(unsubscribedUpdates).toEqual(['exceptions']);
      expect(activeUpdates).toEqual(['exceptions', 'label_created']);
    });
  });
});
