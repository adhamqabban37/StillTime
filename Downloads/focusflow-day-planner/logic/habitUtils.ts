import {
  Habit,
  HabitLog,
  HabitWithStats,
  WeeklyHabitRecap,
  HabitLogStatus,
} from "../types";

// ===== DATE HELPERS =====

// Use locale-safe date formatting to avoid UTC timezone issues
export function getToday(): string {
  return new Date().toLocaleDateString("en-CA"); // Returns YYYY-MM-DD in local timezone
}

export function getDateString(date: Date): string {
  return date.toLocaleDateString("en-CA"); // Returns YYYY-MM-DD in local timezone
}

export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getDay(); // 0=Sun, 1=Mon, ... 6=Sat
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  return new Date(d.setDate(diff));
}

export function getWeekEnd(date: Date = new Date()): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

export function getPreviousWeekStart(): Date {
  const thisWeekStart = getWeekStart();
  const prevWeekStart = new Date(thisWeekStart);
  prevWeekStart.setDate(thisWeekStart.getDate() - 7);
  return prevWeekStart;
}

export function getDaysInRange(start: Date, end: Date): string[] {
  const days: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(getDateString(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

// ===== HABIT EXPECTED CHECK =====

export function isHabitExpectedOnDate(habit: Habit, dateStr: string): boolean {
  const createdDate = habit.createdAt.split("T")[0];
  if (dateStr < createdDate) return false; // Habit didn't exist yet
  if (habit.archived) return false;

  const dayOfWeek = getDayOfWeek(dateStr);

  switch (habit.frequencyType) {
    case "daily":
      return true;
    case "custom":
      return habit.daysOfWeek?.includes(dayOfWeek) ?? false;
    case "weekly":
      // For weekly (X times per week), any day counts
      // We just need to track if they hit their target
      return true;
    default:
      return false;
  }
}

// ===== STATUS HELPERS =====

export function getHabitStatusForDate(
  habitId: string,
  date: string,
  logs: HabitLog[]
): HabitLogStatus | null {
  const log = logs.find((l) => l.habitId === habitId && l.date === date);
  return log?.status ?? null;
}

export function getLogsForHabit(habitId: string, logs: HabitLog[]): HabitLog[] {
  return logs.filter((l) => l.habitId === habitId);
}

// ===== STREAK CALCULATION =====

export function calculateStreak(
  habit: Habit,
  logs: HabitLog[],
  upToDate: string = getToday()
): { current: number; longest: number } {
  const habitLogs = getLogsForHabit(habit.id, logs);

  if (habit.frequencyType === "weekly") {
    return calculateWeeklyStreak(habit, habitLogs, upToDate);
  }

  return calculateDailyStreak(habit, habitLogs, upToDate);
}

function calculateDailyStreak(
  habit: Habit,
  logs: HabitLog[],
  upToDate: string
): { current: number; longest: number } {
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Sort logs by date descending
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const completedDates = new Set(
    sortedLogs.filter((l) => l.status === "done").map((l) => l.date)
  );

  // Streak freeze: allow 1 missed day per week without breaking streak
  const streakFreezeEnabled = habit.streakFreezeEnabled ?? false;
  let freezeUsedThisWeek = false;
  let currentWeekStart = getWeekStart(new Date(upToDate + "T00:00:00"));

  // Calculate current streak (going back from today)
  // Performance guard: limit iterations to prevent O(n²) blowups
  const MAX_STREAK_LOOKBACK = 400; // ~1 year + buffer
  let iterations = 0;
  let checkDate = new Date(upToDate + "T00:00:00");
  while (iterations < MAX_STREAK_LOOKBACK) {
    iterations++;
    const dateStr = getDateString(checkDate);

    // Track week changes for streak freeze reset
    const thisWeekStart = getWeekStart(new Date(checkDate));
    if (thisWeekStart.getTime() !== currentWeekStart.getTime()) {
      currentWeekStart = thisWeekStart;
      freezeUsedThisWeek = false;
    }

    if (!isHabitExpectedOnDate(habit, dateStr)) {
      // Rest day - don't break streak, just skip
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    if (completedDates.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (streakFreezeEnabled && !freezeUsedThisWeek) {
      // Use streak freeze - skip this missed day without breaking streak
      freezeUsedThisWeek = true;
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    } else {
      break;
    }

    // Don't go back more than a year
    if (currentStreak > 365) break;
  }

  // Calculate longest streak (with freeze support)
  // Performance guard: limit to last 400 days to prevent O(n²) blowups
  const MAX_LONGEST_LOOKBACK = 400;
  const startDate = new Date(habit.createdAt);
  const endDate = new Date(upToDate + "T00:00:00");
  const daysDiff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const limitedStartDate =
    daysDiff > MAX_LONGEST_LOOKBACK
      ? new Date(endDate.getTime() - MAX_LONGEST_LOOKBACK * 24 * 60 * 60 * 1000)
      : startDate;
  const allDates = getDaysInRange(limitedStartDate, endDate);

  let longestFreezeUsedThisWeek = false;
  let longestCurrentWeekStart =
    allDates.length > 0
      ? getWeekStart(new Date(allDates[0] + "T00:00:00"))
      : new Date();

  for (const date of allDates) {
    // Track week changes
    const thisWeekStart = getWeekStart(new Date(date + "T00:00:00"));
    if (thisWeekStart.getTime() !== longestCurrentWeekStart.getTime()) {
      longestCurrentWeekStart = thisWeekStart;
      longestFreezeUsedThisWeek = false;
    }

    if (!isHabitExpectedOnDate(habit, date)) {
      // Rest day - don't break streak
      continue;
    }

    if (completedDates.has(date)) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else if (streakFreezeEnabled && !longestFreezeUsedThisWeek) {
      // Use freeze - don't break streak
      longestFreezeUsedThisWeek = true;
      continue;
    } else {
      tempStreak = 0;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { current: currentStreak, longest: longestStreak };
}

function calculateWeeklyStreak(
  habit: Habit,
  logs: HabitLog[],
  upToDate: string
): { current: number; longest: number } {
  // For weekly habits, streak = consecutive successful weeks
  const targetPerWeek = habit.targetPerWeek || 1;
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Go back week by week
  const today = new Date(upToDate + "T00:00:00");
  const createdDate = new Date(habit.createdAt);
  let weekStart = getWeekStart(today);

  // Calculate current streak
  while (weekStart >= createdDate) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekDays = getDaysInRange(weekStart, weekEnd);
    const completedThisWeek = weekDays.filter((d) =>
      logs.some(
        (l) => l.habitId === habit.id && l.date === d && l.status === "done"
      )
    ).length;

    if (completedThisWeek >= targetPerWeek) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      if (currentStreak === 0) currentStreak = tempStreak;
      tempStreak = 0;
    }

    weekStart.setDate(weekStart.getDate() - 7);
  }

  if (currentStreak === 0) currentStreak = tempStreak;
  longestStreak = Math.max(longestStreak, currentStreak);

  return { current: currentStreak, longest: longestStreak };
}

// ===== COMPLETION RATE =====

export function calculateCompletionRate(
  habit: Habit,
  logs: HabitLog[],
  days: number = 30
): number {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);

  const dates = getDaysInRange(startDate, today);
  let expectedDays = 0;
  let completedDays = 0;

  const habitLogs = getLogsForHabit(habit.id, logs);
  const completedSet = new Set(
    habitLogs.filter((l) => l.status === "done").map((l) => l.date)
  );

  for (const date of dates) {
    if (isHabitExpectedOnDate(habit, date)) {
      expectedDays++;
      if (completedSet.has(date)) {
        completedDays++;
      }
    }
  }

  return expectedDays > 0
    ? Math.round((completedDays / expectedDays) * 100)
    : 0;
}

// ===== HABIT WITH STATS =====

export function enrichHabitWithStats(
  habit: Habit,
  logs: HabitLog[]
): HabitWithStats {
  const today = getToday();
  const { current, longest } = calculateStreak(habit, logs, today);
  const completionRate = calculateCompletionRate(habit, logs);
  const todayStatus = getHabitStatusForDate(habit.id, today, logs);
  const isExpectedToday = isHabitExpectedOnDate(habit, today);

  // Calculate completions this week for weekly habits
  const todayDate = new Date(today + "T00:00:00");
  const weekStart = getWeekStart(todayDate);
  const weekEnd = getWeekEnd(todayDate);
  const daysThisWeek = getDaysInRange(weekStart, weekEnd);
  const completionsThisWeek = daysThisWeek.filter(
    (date) => getHabitStatusForDate(habit.id, date, logs) === "done"
  ).length;

  return {
    ...habit,
    currentStreak: current,
    longestStreak: longest,
    completionRate,
    todayStatus,
    isExpectedToday,
    completionsThisWeek,
  };
}

export function getTodaysHabits(
  habits: Habit[],
  logs: HabitLog[]
): HabitWithStats[] {
  const today = getToday();

  return habits
    .filter((h) => !h.archived && isHabitExpectedOnDate(h, today))
    .map((h) => enrichHabitWithStats(h, logs))
    .sort((a, b) => {
      // Sort: incomplete first, then by reminder time
      if (a.todayStatus === "done" && b.todayStatus !== "done") return 1;
      if (a.todayStatus !== "done" && b.todayStatus === "done") return -1;
      return (a.reminderTime || "23:59").localeCompare(
        b.reminderTime || "23:59"
      );
    });
}

// ===== WEEKLY RECAP =====

export function generateWeeklyRecap(
  habits: Habit[],
  logs: HabitLog[],
  weekStartDate?: Date
): WeeklyHabitRecap {
  const weekStart = weekStartDate || getPreviousWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekDays = getDaysInRange(weekStart, weekEnd);

  const habitStats = habits
    .filter((h) => !h.archived)
    .map((habit) => {
      let expected = 0;
      let completed = 0;

      for (const date of weekDays) {
        if (isHabitExpectedOnDate(habit, date)) {
          expected++;
          const status = getHabitStatusForDate(habit.id, date, logs);
          if (status === "done") {
            completed++;
          }
        }
      }

      return {
        habitId: habit.id,
        habitTitle: habit.title,
        habitIcon: habit.icon,
        expected,
        completed,
        completionRate:
          expected > 0 ? Math.round((completed / expected) * 100) : 0,
      };
    });

  const totalExpected = habitStats.reduce((sum, h) => sum + h.expected, 0);
  const totalCompleted = habitStats.reduce((sum, h) => sum + h.completed, 0);

  // Find best and worst habits
  const sortedByRate = [...habitStats].sort(
    (a, b) => b.completionRate - a.completionRate
  );
  const bestHabit =
    sortedByRate[0]?.completionRate > 0
      ? sortedByRate[0].habitTitle
      : undefined;
  const worstWithExpectation = sortedByRate.filter((h) => h.expected > 0);
  const needsWorkHabit =
    worstWithExpectation.length > 1 &&
    worstWithExpectation[worstWithExpectation.length - 1].completionRate < 100
      ? worstWithExpectation[worstWithExpectation.length - 1].habitTitle
      : undefined;

  return {
    weekStart: getDateString(weekStart),
    weekEnd: getDateString(weekEnd),
    habits: habitStats,
    overallCompletionRate:
      totalExpected > 0
        ? Math.round((totalCompleted / totalExpected) * 100)
        : 0,
    bestHabit,
    needsWorkHabit,
  };
}

// ===== CHECK IF MONDAY FOR RECAP =====

// FIX: Show recap for the entire week until dismissed, not just Monday morning
export function shouldShowWeeklyRecap(): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Show recap anytime during the week if user hasn't seen it
  // Priority on Monday, but available all week
  return dayOfWeek >= 1; // Monday through Saturday (recap is for previous week)
}

// Check if there's an unseen recap waiting
export function hasUnseenRecap(): boolean {
  const pendingRecap = localStorage.getItem("focusflow-pending-recap");
  return pendingRecap !== null;
}

// Get the cached pending recap
export function getPendingRecap(): WeeklyHabitRecap | null {
  try {
    const pendingRecap = localStorage.getItem("focusflow-pending-recap");
    return pendingRecap ? JSON.parse(pendingRecap) : null;
  } catch {
    return null;
  }
}

// Cache a recap to show until dismissed
export function cachePendingRecap(recap: WeeklyHabitRecap): void {
  localStorage.setItem("focusflow-pending-recap", JSON.stringify(recap));
}

// Clear the pending recap when dismissed
export function clearPendingRecap(): void {
  localStorage.removeItem("focusflow-pending-recap");
}

export function hasSeenRecapThisWeek(): boolean {
  const lastSeen = localStorage.getItem("focusflow-last-recap-seen");
  if (!lastSeen) return false;

  const weekStart = getWeekStart();
  return lastSeen >= getDateString(weekStart);
}

export function markRecapAsSeen(): void {
  localStorage.setItem("focusflow-last-recap-seen", getToday());
  clearPendingRecap(); // Also clear the cached recap when dismissed
}

// ===== STORAGE CLEANUP =====

// Trim old habit logs older than 90 days to prevent localStorage bloat
export function cleanupOldHabitLogs(habitLogs: HabitLog[]): HabitLog[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  const cutoffStr = getDateString(cutoffDate);

  return habitLogs.filter((log) => log.date >= cutoffStr);
}

// Safe localStorage write wrapper with quota handling
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    // Handle QuotaExceededError
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn(
        `localStorage quota exceeded for key: ${key}. Attempting cleanup...`
      );
      // Try to clear old data and retry
      try {
        localStorage.removeItem("focusflow-pending-recap");
        localStorage.setItem(key, value);
        return true;
      } catch {
        console.error("Failed to save even after cleanup:", key);
        return false;
      }
    }
    console.error("Error writing to localStorage:", error);
    return false;
  }
}
