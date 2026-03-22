import { Task, Habit, HabitLog } from "../types.ts";
import { calculateStreak, getLogsForHabit } from "./habitUtils.ts";

// A simple scoring model
export const calculateProductivityScore = (tasks: Task[]): number => {
  const completedTasks = tasks.filter((t) => t.completed);
  const totalTasks = tasks.length;
  if (totalTasks === 0) return 0;

  const completionRate = completedTasks.length / totalTasks;
  const totalDuration = completedTasks.reduce((sum, t) => sum + t.duration, 0);

  // Score based on completion rate and volume (capped)
  const score = Math.round(
    completionRate * 70 + Math.min(totalDuration / 10, 30)
  );
  return score;
};

export const getWeeklyCompletionData = (
  tasks: Task[]
): { day: string; rate: number }[] => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const weeklyData = days.map((_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - ((today.getDay() - i + 7) % 7));
    const dayString = day.toLocaleDateString("en-CA"); // Timezone-safe

    // FIX: Added proper parentheses for filter logic
    const tasksForDay = tasks.filter((t) => {
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt).toLocaleDateString("en-CA");
      return completedDate === dayString;
    });
    const completed = tasksForDay.filter((t) => t.completed).length;

    // Also count tasks scheduled for this day (whether completed or not)
    const scheduledForDay = tasks.filter((t) => {
      // Check if task was created/scheduled for this day
      return t.startTime !== undefined;
    });

    return {
      day: days[day.getDay()],
      rate:
        tasksForDay.length > 0
          ? (completed / Math.max(tasksForDay.length, 1)) * 100
          : 0,
    };
  });
  return weeklyData;
};

export const getHeatmapData = (
  tasks: Task[],
  habitLogs: HabitLog[] = []
): number[][] => {
  // Create a 4-week x 7-day grid (28 cells)
  // Now includes BOTH completed tasks AND completed habits
  const weeksToShow = 4;
  const data: number[] = [];
  const today = new Date();

  // Go back 4 weeks and count completions per day
  for (let week = weeksToShow - 1; week >= 0; week--) {
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const checkDate = new Date(today);
      checkDate.setDate(
        today.getDate() - week * 7 - (today.getDay() - dayOfWeek)
      );
      const dateStr = checkDate.toLocaleDateString("en-CA"); // Timezone-safe YYYY-MM-DD

      // Count tasks completed on this date
      const completedTaskCount = tasks.filter((t) => {
        if (!t.completed || !t.completedAt) return false;
        const completedDate = new Date(t.completedAt).toLocaleDateString(
          "en-CA"
        );
        return completedDate === dateStr;
      }).length;

      // Count habits completed on this date
      const completedHabitCount = habitLogs.filter((log) => {
        return log.date === dateStr && log.status === "done";
      }).length;

      // Total activity = tasks + habits
      data.push(completedTaskCount + completedHabitCount);
    }
  }

  return [data];
};

// FIX: Use real habit data with proper streak calculation
export const calculateHabitStreaksFromData = (
  habits: Habit[],
  habitLogs: HabitLog[]
): { name: string; streak: number }[] => {
  return habits
    .filter((h) => !h.archived)
    .map((h) => {
      const { current } = calculateStreak(h, habitLogs);
      return {
        name: h.title,
        streak: current,
      };
    })
    .filter((s) => s.streak > 0)
    .sort((a, b) => b.streak - a.streak);
};

// DEPRECATED: Keep for backwards compatibility but use calculateHabitStreaksFromData instead
export const calculateHabitStreaks = (
  tasks: Task[]
): { name: string; streak: number }[] => {
  // This function cannot calculate real streaks without habit logs
  // Return empty array - the ReviewScreen should use calculateHabitStreaksFromData
  const habits = tasks.filter((t) => t.type === "Habit");
  return habits
    .map((h) => ({
      name: h.title,
      streak: h.completed ? 1 : 0, // At least show 1 if completed today
    }))
    .filter((s) => s.streak > 0)
    .sort((a, b) => b.streak - a.streak);
};
