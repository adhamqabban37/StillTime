// Streak tracking logic using localStorage

interface StreakData {
  currentStreak: number;
  lastCompletionDate: string; // YYYY-MM-DD format
  longestStreak: number;
}

const STREAK_KEY = "focusflow-streak";

function getDateString(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA"); // Returns YYYY-MM-DD in local timezone
}

function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateString(yesterday);
}

export function getStreakData(): StreakData {
  try {
    const stored = localStorage.getItem(STREAK_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading streak data:", e);
  }
  return {
    currentStreak: 0,
    lastCompletionDate: "",
    longestStreak: 0,
  };
}

export function updateStreak(): StreakData {
  const today = getDateString();
  const yesterday = getYesterday();
  const data = getStreakData();

  // If already completed today, no change
  if (data.lastCompletionDate === today) {
    return data;
  }

  // If completed yesterday, increment streak
  if (data.lastCompletionDate === yesterday) {
    data.currentStreak += 1;
  }
  // If this is first completion or streak was broken, start at 1
  else if (data.lastCompletionDate !== today) {
    data.currentStreak = 1;
  }

  // Update last completion date
  data.lastCompletionDate = today;

  // Update longest streak if current is higher
  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak;
  }

  // Save to localStorage
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving streak data:", e);
  }

  return data;
}

export function checkStreakOnLoad(): StreakData {
  const today = getDateString();
  const yesterday = getYesterday();
  const data = getStreakData();

  // If last completion was before yesterday, streak is broken
  if (
    data.lastCompletionDate !== today &&
    data.lastCompletionDate !== yesterday
  ) {
    data.currentStreak = 0;
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Error saving streak data:", e);
    }
  }

  return data;
}
