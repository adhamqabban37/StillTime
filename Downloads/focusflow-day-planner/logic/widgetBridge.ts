import { Preferences } from '@capacitor/preferences';
import { AppState } from '../types';

export const WidgetBridge = {
  async syncState(state: AppState) {
    try {
      // We only sync essential data needed for widgets to keep the payload tight
      
      // 1. Daily Tasks Widget
      const today = new Date().toDateString();
      const todaysTasks = state.tasks
        .filter(t => !t.completed && (t.recurrence === 'daily' || new Date(t.createdAt).toDateString() === today))
        .slice(0, 5)
        .map(t => ({ id: t.id, title: t.title, completed: t.completed }));
      
      await Preferences.set({
        key: 'widget_tasks',
        value: JSON.stringify(todaysTasks)
      });

      // 2. Habit Streaks Widget
      const streaks = state.habits.slice(0, 3).map(h => {
        // Calculate mock streak or use real logic
        const streakCount = state.habitLogs.filter(l => l.title.includes(h.title)).length;
        return { title: h.title, streak: streakCount };
      });

      await Preferences.set({
        key: 'widget_streaks',
        value: JSON.stringify(streaks)
      });

      // 3. Focus Timer Widget
      if (state.focusedTask && state.focusSessionEnd) {
        const remainingStr = Math.max(0, Math.floor((state.focusSessionEnd - Date.now()) / 1000));
        await Preferences.set({
          key: 'widget_focus',
          value: JSON.stringify({
            title: state.focusedTask.title,
            endTime: state.focusSessionEnd,
            remainingSeconds: remainingStr
          })
        });
      } else {
        await Preferences.remove({ key: 'widget_focus' });
      }

    } catch (e) {
      console.warn("Failed to sync widget data", e);
    }
  }
};
