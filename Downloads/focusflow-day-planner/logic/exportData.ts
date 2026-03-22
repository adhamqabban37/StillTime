import { Task, SavedItem, Habit, HabitLog } from "../types.ts";

export interface ExportData {
  exportedAt: string;
  version: "1.1"; // Bumped version for new schema
  tasks: Task[];
  savedItems: SavedItem[];
  habits: Habit[];
  habitLogs: HabitLog[];
  gamification: {
    points: number;
    badges: string[];
  };
  streak: {
    currentStreak: number;
    lastCompletionDate: string | null;
    longestStreak: number;
  };
}

export function exportAllData(
  tasks: Task[],
  savedItems: SavedItem[],
  gamification: { points: number; badges: string[] },
  habits?: Habit[],
  habitLogs?: HabitLog[]
): void {
  // FIX: Use correct key "focusflow-streak" (with hyphen, not underscore)
  const streakData = localStorage.getItem("focusflow-streak");
  const streak = streakData
    ? JSON.parse(streakData)
    : { currentStreak: 0, lastCompletionDate: null, longestStreak: 0 };

  // Get habits and habitLogs from localStorage if not provided
  const habitsToExport =
    habits ||
    (() => {
      try {
        const stored = localStorage.getItem("focusflow-habits");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    })();

  const habitLogsToExport =
    habitLogs ||
    (() => {
      try {
        const stored = localStorage.getItem("focusflow-habit-logs");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    })();

  const data: ExportData = {
    exportedAt: new Date().toISOString(),
    version: "1.1",
    tasks,
    savedItems,
    habits: habitsToExport,
    habitLogs: habitLogsToExport,
    gamification,
    streak,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const date = new Date().toLocaleDateString("en-CA"); // Timezone-safe
  const filename = `focusflow-export-${date}.json`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
