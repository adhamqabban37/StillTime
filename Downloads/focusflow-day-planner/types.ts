export type TaskType = "Task" | "Habit";
export type TaskCategory =
  | "Work"
  | "Personal"
  | "Health"
  | "Learning"
  | "Other";
export type AppMode =
  | "Home"
  | "Timeline"
  | "Habits"
  | "Inbox"
  | "Review"
  | "Matrix"
  | "Accountability"
  | "Ideas"
  | "Settings";

// ===== IDEAS JOURNAL TYPES =====
export type IdeaTopic =
  | "Sports"
  | "Work"
  | "Personal"
  | "Learning"
  | "Creative"
  | "Other";

export interface Idea {
  id: string;
  title: string;
  content: string;
  topic: IdeaTopic;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  tags?: string[];
}
export type Theme = "light" | "dark" | "system";
export type MatrixQuadrant = "do" | "schedule" | "delegate" | "delete";
export type MoodLevel =
  | "energized"
  | "focused"
  | "tired"
  | "stressed"
  | "neutral";

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  category?: TaskCategory; // Color-coded category tag
  duration: number; // in minutes
  startTime: string; // "HH:mm" format
  recurrence: "daily" | "none";
  completed: boolean;
  completedAt?: string; // ISO string
  linkedItemId?: string; // Link to a SavedItem
  matrixQuadrant?: MatrixQuadrant;
  actualDuration?: number; // Tracked actual time spent
  aiGenerated?: boolean; // Was this task AI-generated from breakdown
  notes?: string; // Task notes/description
  snoozedTo?: string; // Date string (YYYY-MM-DD) for snoozed tasks
}

export type SavedItemStatus = "inbox" | "scheduled" | "completed";
export type SavedItemSource = "YouTube" | "Instagram" | "Web" | "Other";

export interface SavedItem {
  id: string;
  url: string;
  source: SavedItemSource;
  title: string;
  thumbnail?: string;
  duration?: number; // in minutes
  addedAt: string; // ISO string
  status: SavedItemStatus;
  matrixQuadrant?: MatrixQuadrant;
  aiCategory?: string; // AI-categorized topic
  aiPriority?: "high" | "medium" | "low"; // AI-suggested priority
  aiSummary?: string; // AI-generated summary
}

export type SuggestionType =
  | "deep_work"
  | "low_energy"
  | "wrap_up"
  | "planning"
  | "habit";

export type SuggestionFeedback = "helpful" | "not_helpful" | "skipped";

export interface NextActionSuggestion {
  task: Task;
  reason: string; // The AI-generated motivational text
  suggestionType: SuggestionType;
  moodAdjusted?: boolean; // Was this adjusted based on mood
}

export interface DailySummary {
  date: string;
  tasksCompleted: number;
  totalTasks: number;
  focusMinutes: number;
  habitsCompleted: number;
  totalHabits: number;
  aiInsight: string;
  topAccomplishment: string;
  suggestionForTomorrow: string;
}

export interface ParsedTaskFromNL {
  title: string;
  duration: number;
  type: TaskType;
  suggestedTime?: string;
  matrixQuadrant?: MatrixQuadrant;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// ===== HABIT TRACKER TYPES =====
export type HabitFrequencyType = "daily" | "weekly" | "custom";
export type HabitLogStatus = "done" | "missed" | "rest";

export interface Habit {
  id: string;
  title: string;
  icon: string; // emoji like 🏋️ 📚 💧
  frequencyType: HabitFrequencyType;
  targetPerWeek?: number; // for 'weekly' type: 5x/week, 3x/week, etc.
  daysOfWeek?: number[]; // for 'custom' type: 0=Sun, 1=Mon, ... 6=Sat
  reminderTime?: string; // "HH:mm" format
  createdAt: string; // ISO string
  archived?: boolean;
  streakFreezeEnabled?: boolean; // Allow 1 missed day per week without breaking streak
}

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD format
  status: HabitLogStatus;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // percentage
  todayStatus: HabitLogStatus | null;
  isExpectedToday: boolean;
  completionsThisWeek: number; // for weekly frequency habits
}

export interface WeeklyHabitRecap {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  habits: {
    habitId: string;
    habitTitle: string;
    habitIcon: string;
    expected: number;
    completed: number;
    completionRate: number;
  }[];
  overallCompletionRate: number;
  bestHabit?: string;
  needsWorkHabit?: string;
}

export interface Toast {
  id: number;
  message: string;
  icon?: string;
}

// ===== VOICE ASSISTANT TYPES =====
export interface VoiceParsedTask {
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  duration: number; // minutes
  type: TaskType;
}

// ===== AUTOPILOT TYPES =====
export interface AutopilotSlot {
  taskId: string;
  title: string;
  start: string; // HH:mm
  end: string; // HH:mm
  duration: number;
}

// ===== GOOGLE CALENDAR TYPES =====
export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  startTime: string; // HH:mm (derived)
  endTime: string; // HH:mm (derived)
  duration: number; // minutes (derived)
  isAllDay: boolean;
  source: "google";
}

export interface AppState {
  tasks: Task[];
  savedItems: SavedItem[];
  habits: Habit[];
  habitLogs: HabitLog[];
  goals: Habit[]; // Using Habit type for goals too
  goalLogs: HabitLog[];
  ideas: Idea[];
  isAddTaskFormOpen: boolean;
  isAddHabitFormOpen: boolean;
  isAddGoalFormOpen: boolean;
  isAddIdeaFormOpen: boolean;
  editingHabit: Habit | null;
  selectedHabit: Habit | null; // for detail modal
  editingGoal: Habit | null;
  selectedGoal: Habit | null;
  focusedTask: Task | null;
  editingTask: Task | null;
  editingIdea: Idea | null;
  selectedIdeaTopic: IdeaTopic | "all";
  mode: AppMode;
  activeTask: Task | null;
  controlPanelTask: Task | null;
  actionPanelItem: SavedItem | null;
  taskDefaults: Partial<Task> | null; // For pre-filling from SavedItem
  theme: Theme;
  activeModal:
    | "addTask"
    | "controlPanel"
    | "actionPanel"
    | "addHabit"
    | "addGoal"
    | "habitDetail"
    | "goalDetail"
    | "addIdea"
    | null;
  focusSessionEnd: number | null;
  notificationPermission: "default" | "granted" | "denied";
  nextActionSuggestion: NextActionSuggestion | null;
  gamification: {
    points: number;
    badges: string[]; // array of badge IDs
  };
  toast: Toast | null;
  showConfetti: boolean;
  showWeeklyRecap: boolean;
  weeklyRecap: WeeklyHabitRecap | null;
  activityLog: ActivityLogEntry[];
  autopilotEnabled: boolean;
  calendarEvents: CalendarEvent[];
  googleCalendarConnected: boolean;
}

// Activity Log for comprehensive tracking
export type ActivityType =
  | "task_created"
  | "task_completed"
  | "task_updated"
  | "task_deleted"
  | "habit_logged"
  | "focus_started"
  | "focus_ended"
  | "badge_earned"
  | "streak_milestone";

export interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  timestamp: string; // ISO string
  title: string;
  details?: string;
  points?: number;
}

export type AppAction =
  | { type: "SET_TASKS"; payload: Task[] }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: string }
  | { type: "SET_SAVED_ITEMS"; payload: SavedItem[] }
  | {
      type: "TOGGLE_ADD_TASK_FORM";
      payload: { isOpen: boolean; defaults?: Partial<Task> };
    }
  | { type: "SET_EDITING_TASK"; payload: Task | null }
  | { type: "START_FOCUS"; payload: Task }
  | { type: "END_FOCUS" }
  | { type: "SET_MODE"; payload: AppMode }
  | { type: "SET_ACTIVE_TASK"; payload: Task | null }
  | { type: "SET_CONTROL_PANEL_TASK"; payload: Task | null }
  | { type: "COMPLETE_TASK"; payload: { taskId: string; completedAt: string } }
  | { type: "UNCOMPLETE_TASK"; payload: string }
  | { type: "RESET_DAILY_HABITS" }
  | { type: "RESTORE_BACKUP"; payload: Partial<AppState> }
  | { type: "ADD_SAVED_ITEM"; payload: SavedItem }
  | { type: "UPDATE_SAVED_ITEM"; payload: Partial<SavedItem> & { id: string } }
  | { type: "DELETE_SAVED_ITEM"; payload: string }
  | { type: "SET_ACTION_PANEL_ITEM"; payload: SavedItem | null }
  | { type: "SET_THEME"; payload: Theme }
  | {
      type: "SET_NOTIFICATION_PERMISSION";
      payload: "granted" | "denied" | "default";
    }
  | { type: "CLOSE_ACTIVE_MODAL" }
  | { type: "SET_NEXT_ACTION_SUGGESTION"; payload: NextActionSuggestion | null }
  | { type: "ADD_POINTS"; payload: number }
  | { type: "AWARD_BADGE"; payload: string }
  | { type: "SHOW_TOAST"; payload: Omit<Toast, "id"> }
  | { type: "HIDE_TOAST" }
  | { type: "SHOW_CONFETTI" }
  | { type: "HIDE_CONFETTI" }
  // Activity Log Actions
  | { type: "LOG_ACTIVITY"; payload: ActivityLogEntry }
  | { type: "SET_ACTIVITY_LOG"; payload: ActivityLogEntry[] }
  // Habit Tracker Actions
  | { type: "SET_HABITS"; payload: Habit[] }
  | { type: "ADD_HABIT"; payload: Habit }
  | { type: "UPDATE_HABIT"; payload: Habit }
  | { type: "DELETE_HABIT"; payload: string }
  | { type: "ARCHIVE_HABIT"; payload: string }
  | { type: "SET_HABIT_LOGS"; payload: HabitLog[] }
  | { type: "LOG_HABIT"; payload: HabitLog }
  | { type: "REMOVE_HABIT_LOG"; payload: { habitId: string; date: string } }
  | { type: "TOGGLE_ADD_HABIT_FORM"; payload: boolean }
  | { type: "SET_EDITING_HABIT"; payload: Habit | null }
  | { type: "SET_SELECTED_HABIT"; payload: Habit | null }
  | { type: "SHOW_WEEKLY_RECAP"; payload: WeeklyHabitRecap }
  | { type: "HIDE_WEEKLY_RECAP" }
  // Goal/Accountability Actions
  | { type: "SET_GOALS"; payload: Habit[] }
  | { type: "ADD_GOAL"; payload: Habit }
  | { type: "UPDATE_GOAL"; payload: Habit }
  | { type: "DELETE_GOAL"; payload: string }
  | { type: "ARCHIVE_GOAL"; payload: string }
  | { type: "SET_GOAL_LOGS"; payload: HabitLog[] }
  | { type: "LOG_GOAL"; payload: HabitLog }
  | { type: "REMOVE_GOAL_LOG"; payload: { habitId: string; date: string } }
  | { type: "TOGGLE_ADD_GOAL_FORM"; payload: boolean }
  | { type: "SET_EDITING_GOAL"; payload: Habit | null }
  | { type: "SET_SELECTED_GOAL"; payload: Habit | null }
  // Ideas Journal Actions
  | { type: "SET_IDEAS"; payload: Idea[] }
  | { type: "ADD_IDEA"; payload: Idea }
  | { type: "UPDATE_IDEA"; payload: Idea }
  | { type: "DELETE_IDEA"; payload: string }
  | { type: "TOGGLE_ADD_IDEA_FORM"; payload: boolean }
  | { type: "SET_EDITING_IDEA"; payload: Idea | null }
  | { type: "SET_SELECTED_IDEA_TOPIC"; payload: IdeaTopic | "all" }
  // Autopilot Actions
  | { type: "SET_AUTOPILOT"; payload: boolean }
  // Google Calendar Actions
  | { type: "SET_CALENDAR_EVENTS"; payload: CalendarEvent[] }
  | { type: "SET_GOOGLE_CALENDAR_CONNECTED"; payload: boolean };
