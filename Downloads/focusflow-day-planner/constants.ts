import { Badge, TaskCategory } from "./types.ts";

export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 18;
export const MINUTE_HEIGHT = 2; // The height of one minute in pixels on the timeline

// Category colors and config
export const CATEGORY_CONFIG: Record<
  TaskCategory,
  { label: string; color: string; bgColor: string; darkBgColor: string }
> = {
  Work: {
    label: "Work",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100",
    darkBgColor: "dark:bg-blue-900/40",
  },
  Personal: {
    label: "Personal",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-100",
    darkBgColor: "dark:bg-purple-900/40",
  },
  Health: {
    label: "Health",
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-100",
    darkBgColor: "dark:bg-emerald-900/40",
  },
  Learning: {
    label: "Learning",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-100",
    darkBgColor: "dark:bg-amber-900/40",
  },
  Other: {
    label: "Other",
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100",
    darkBgColor: "dark:bg-slate-700/40",
  },
};

export const BADGES: {
  [key: string]: Badge & { condition: (state: any) => boolean };
} = {
  FIRST_TASK: {
    id: "FIRST_TASK",
    name: "First Step",
    description: "Completed your first task.",
    icon: "✅",
    condition: (state) => state.tasks.filter((t) => t.completed).length === 1,
  },
  STREAK_5: {
    id: "STREAK_5",
    name: "On a Roll",
    description: "Maintained a 5-day habit streak.",
    icon: "🔥",
    condition: (state) => {
      // This is a simplified check. A real app would need more robust date tracking.
      const streaks = state.tasks
        .filter((t) => t.type === "Habit")
        .map((h) => (h.recurrence === "daily" ? 5 : 0)); // Mock streak
      return Math.max(...streaks) >= 5;
    },
  },
  FOCUS_MASTER: {
    id: "FOCUS_MASTER",
    name: "Focus Master",
    description: "Completed a focus session of 60 minutes or more.",
    icon: "🧘",
    condition: (state, completedTask) => completedTask?.duration >= 60,
  },
  INBOX_ZERO: {
    id: "INBOX_ZERO",
    name: "Inbox Zero",
    description: "Cleared your entire inbox.",
    icon: "📭",
    condition: (state) =>
      state.savedItems.filter((i) => i.status === "inbox").length === 0,
  },
};
