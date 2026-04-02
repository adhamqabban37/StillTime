import {
  AppState,
  Task,
  SavedItem,
  Habit,
  HabitLog,
  Idea,
  ActivityLogEntry,
} from "../types";
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export interface ExportData {
  exportedAt: string;
  version: "1.2";
  tasks: Task[];
  savedItems: SavedItem[];
  habits: Habit[];
  habitLogs: HabitLog[];
  goals: Habit[];
  goalLogs: HabitLog[];
  ideas: Idea[];
  activityLog?: ActivityLogEntry[];
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

const isNative = () => Capacitor.isNativePlatform();

const getDateStamp = () => new Date().toLocaleDateString("en-CA");

const getStreakState = () => {
  const streakData = localStorage.getItem("focusflow-streak");
  return streakData
    ? JSON.parse(streakData)
    : { currentStreak: 0, lastCompletionDate: null, longestStreak: 0 };
};

const toExportData = (state: Partial<AppState>): ExportData => {
  const streak = getStreakState();

  return {
    exportedAt: new Date().toISOString(),
    version: "1.2",
    tasks: state.tasks || [],
    savedItems: state.savedItems || [],
    habits: state.habits || [],
    habitLogs: state.habitLogs || [],
    goals: state.goals || [],
    goalLogs: state.goalLogs || [],
    ideas: state.ideas || [],
    activityLog: state.activityLog || [],
    gamification: state.gamification || { points: 0, badges: [] },
    streak,
  };
};

const createSummaryText = (state: Partial<AppState>): string => {
  const tasks = state.tasks || [];
  const habits = state.habits || [];
  const habitLogs = state.habitLogs || [];
  const ideas = state.ideas || [];
  const today = new Date().toLocaleDateString("en-CA");

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const minutesCompleted = tasks
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + (t.actualDuration || t.duration || 0), 0);

  const activeHabits = habits.filter((h) => !h.archived);
  const todayHabitsCompleted = habitLogs.filter(
    (l) => l.date === today && l.status === "done",
  ).length;

  const topOpenTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 5)
    .map((t) => `- ${t.startTime} • ${t.title} (${t.duration}m)`)
    .join("\n");

  return [
    "FocusFlow Daily Summary",
    "=======================",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "Overview",
    `- Tasks completed: ${completedTasks}/${totalTasks}`,
    `- Focus minutes completed: ${minutesCompleted}`,
    `- Habits completed today: ${todayHabitsCompleted}/${activeHabits.length}`,
    `- Ideas captured: ${ideas.length}`,
    "",
    "Next Tasks",
    topOpenTasks || "- No pending scheduled tasks",
    "",
  ].join("\n");
};

const downloadTextFile = (
  filename: string,
  content: string,
  mimeType: string,
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

async function shareOrDownloadText(
  filename: string,
  content: string,
  mimeType: string,
): Promise<void> {
  if (isNative()) {
    const written = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });

    await Share.share({
      title: "FocusFlow Export",
      text: "Exported from FocusFlow",
      url: written.uri,
      dialogTitle: "Share export",
    });
    return;
  }

  downloadTextFile(filename, content, mimeType);
}

export async function exportAllData(state: Partial<AppState>): Promise<void> {
  const data = toExportData(state);
  const filename = `focusflow-export-${getDateStamp()}.json`;
  const json = JSON.stringify(data, null, 2);

  await shareOrDownloadText(filename, json, "application/json");
}

export async function exportSummary(state: Partial<AppState>): Promise<void> {
  const filename = `focusflow-summary-${getDateStamp()}.txt`;
  const summary = createSummaryText(state);
  await shareOrDownloadText(filename, summary, "text/plain;charset=utf-8");
}

export async function importData(file: File): Promise<Partial<ExportData>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (!data.version || !data.tasks) {
          throw new Error("Invalid backup file format");
        }

        if (data.streak) {
          localStorage.setItem("focusflow-streak", JSON.stringify(data.streak));
        }

        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
