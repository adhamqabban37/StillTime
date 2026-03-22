import React, {
  createContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  AppState,
  AppAction,
  Task,
  AppMode,
  SavedItem,
  Theme,
  NextActionSuggestion,
  Toast,
  Habit,
  HabitLog,
  WeeklyHabitRecap,
  ActivityLogEntry,
} from "../types.ts";
import { checkAndAwardBadges } from "../logic/gamification.ts";
import { playCompletionSound } from "../logic/sounds.ts";
import { updateStreak } from "../logic/streakTracker.ts";
import {
  shouldShowWeeklyRecap,
  hasSeenRecapThisWeek,
  generateWeeklyRecap,
  markRecapAsSeen,
  hasUnseenRecap,
  getPendingRecap,
  cachePendingRecap,
  cleanupOldHabitLogs,
} from "../logic/habitUtils.ts";

// Safe localStorage wrapper with error handling
const safeGetLocalStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`Failed to read from localStorage: ${key}`, e);
    return null;
  }
};

const safeSetLocalStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Failed to write to localStorage: ${key}`, e);
  }
};

const safeRemoveLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`Failed to remove from localStorage: ${key}`, e);
  }
};

const initialState: AppState = {
  tasks: [],
  savedItems: [],
  habits: [],
  habitLogs: [],
  activityLog: [],
  isAddTaskFormOpen: false,
  isAddHabitFormOpen: false,
  editingHabit: null,
  selectedHabit: null,
  focusedTask: null,
  editingTask: null,
  mode: "Home",
  activeTask: null,
  controlPanelTask: null,
  actionPanelItem: null,
  taskDefaults: null,
  theme: (() => {
    // Read theme from localStorage or check current document class
    const storedTheme = safeGetLocalStorage("theme") as Theme;
    if (storedTheme) return storedTheme;

    // Check if document already has dark/light class set by inline script
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      if (document.documentElement.classList.contains("dark")) {
        return "dark";
      } else if (document.documentElement.classList.contains("light")) {
        return "light";
      }
    }

    return "system";
  })(),
  activeModal: null,
  focusSessionEnd: null,
  notificationPermission: "default",
  nextActionSuggestion: null,
  gamification: {
    points: 0,
    badges: [],
  },
  toast: null,
  showConfetti: false,
  showWeeklyRecap: false,
  weeklyRecap: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_TASKS":
      return { ...state, tasks: action.payload };
    case "ADD_TASK":
      return {
        ...state,
        tasks: [...state.tasks, action.payload].sort((a, b) =>
          a.startTime.localeCompare(b.startTime)
        ),
      };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks
          .map((task) =>
            task.id === action.payload.id ? action.payload : task
          )
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      };
    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      };
    case "TOGGLE_ADD_TASK_FORM":
      return {
        ...state,
        isAddTaskFormOpen: action.payload.isOpen,
        editingTask: null,
        taskDefaults: action.payload.defaults || null,
        activeModal: action.payload.isOpen ? "addTask" : null,
      };
    case "SET_EDITING_TASK":
      return {
        ...state,
        editingTask: action.payload,
        isAddTaskFormOpen: true,
        controlPanelTask: null,
        taskDefaults: null,
        activeModal: "addTask",
      };
    case "START_FOCUS":
      const sessionEnd = Date.now() + action.payload.duration * 60 * 1000;
      safeSetLocalStorage(
        "focusSession",
        JSON.stringify({ task: action.payload, endTime: sessionEnd })
      );
      return {
        ...state,
        focusedTask: action.payload,
        controlPanelTask: null,
        actionPanelItem: null,
        focusSessionEnd: sessionEnd,
      };
    case "END_FOCUS":
      safeRemoveLocalStorage("focusSession");
      return { ...state, focusedTask: null, focusSessionEnd: null };
    case "SET_MODE":
      return { ...state, mode: action.payload };
    case "SET_ACTIVE_TASK":
      return { ...state, activeTask: action.payload };
    case "SET_CONTROL_PANEL_TASK":
      return {
        ...state,
        controlPanelTask: action.payload,
        activeModal: action.payload ? "controlPanel" : null,
      };
    case "COMPLETE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId
            ? { ...t, completed: true, completedAt: action.payload.completedAt }
            : t
        ),
      };
    case "UNCOMPLETE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload
            ? { ...t, completed: false, completedAt: undefined }
            : t
        ),
      };
    case "RESET_DAILY_HABITS":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.type === "Habit" && t.recurrence === "daily"
            ? { ...t, completed: false, completedAt: undefined }
            : t
        ),
      };
    case "ADD_SAVED_ITEM":
      return { ...state, savedItems: [action.payload, ...state.savedItems] };
    case "SET_SAVED_ITEMS":
      return { ...state, savedItems: action.payload };
    case "UPDATE_SAVED_ITEM":
      return {
        ...state,
        savedItems: state.savedItems.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        ),
      };
    case "DELETE_SAVED_ITEM":
      return {
        ...state,
        savedItems: state.savedItems.filter(
          (item) => item.id !== action.payload
        ),
      };
    case "SET_ACTION_PANEL_ITEM":
      return {
        ...state,
        actionPanelItem: action.payload,
        activeModal: action.payload ? "actionPanel" : null,
      };
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "SET_NOTIFICATION_PERMISSION":
      return { ...state, notificationPermission: action.payload };
    case "CLOSE_ACTIVE_MODAL":
      if (state.isAddTaskFormOpen)
        return { ...state, isAddTaskFormOpen: false, activeModal: null };
      if (state.controlPanelTask)
        return { ...state, controlPanelTask: null, activeModal: null };
      if (state.actionPanelItem)
        return { ...state, actionPanelItem: null, activeModal: null };
      return state;
    case "SET_NEXT_ACTION_SUGGESTION":
      return { ...state, nextActionSuggestion: action.payload };
    case "ADD_POINTS":
      return {
        ...state,
        gamification: {
          ...state.gamification,
          points: state.gamification.points + action.payload,
        },
      };
    case "AWARD_BADGE":
      if (state.gamification.badges.includes(action.payload)) return state;
      return {
        ...state,
        gamification: {
          ...state.gamification,
          badges: [...state.gamification.badges, action.payload],
        },
      };
    case "SHOW_TOAST":
      return { ...state, toast: { ...action.payload, id: Date.now() } };
    case "HIDE_TOAST":
      return { ...state, toast: null };
    case "SHOW_CONFETTI":
      return { ...state, showConfetti: true };
    case "HIDE_CONFETTI":
      return { ...state, showConfetti: false };

    // Habit Management
    case "SET_HABITS":
      return { ...state, habits: action.payload };
    case "ADD_HABIT":
      return { ...state, habits: [...state.habits, action.payload] };
    case "UPDATE_HABIT":
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.payload.id ? action.payload : h
        ),
      };
    case "DELETE_HABIT":
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.payload),
        habitLogs: state.habitLogs.filter((l) => l.habitId !== action.payload),
      };
    case "ARCHIVE_HABIT":
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.payload ? { ...h, archived: true } : h
        ),
      };
    case "SET_HABIT_LOGS":
      return { ...state, habitLogs: action.payload };
    case "LOG_HABIT": {
      const existingIndex = state.habitLogs.findIndex(
        (l) =>
          l.habitId === action.payload.habitId && l.date === action.payload.date
      );
      if (existingIndex >= 0) {
        const updatedLogs = [...state.habitLogs];
        updatedLogs[existingIndex] = action.payload;
        return { ...state, habitLogs: updatedLogs };
      }
      return { ...state, habitLogs: [...state.habitLogs, action.payload] };
    }
    case "REMOVE_HABIT_LOG":
      return {
        ...state,
        habitLogs: state.habitLogs.filter(
          (l) =>
            !(
              l.habitId === action.payload.habitId &&
              l.date === action.payload.date
            )
        ),
      };
    case "TOGGLE_ADD_HABIT_FORM":
      return { ...state, isAddHabitFormOpen: action.payload };
    case "SET_EDITING_HABIT":
      return { ...state, editingHabit: action.payload };
    case "SET_SELECTED_HABIT":
      return { ...state, selectedHabit: action.payload };
    case "SHOW_WEEKLY_RECAP":
      return { ...state, showWeeklyRecap: true, weeklyRecap: action.payload };
    case "HIDE_WEEKLY_RECAP":
      return { ...state, showWeeklyRecap: false };

    // Activity Log
    case "LOG_ACTIVITY":
      // Keep only last 100 entries to prevent localStorage bloat
      const newLog = [action.payload, ...state.activityLog].slice(0, 100);
      return { ...state, activityLog: newLog };
    case "SET_ACTIVITY_LOG":
      return { ...state, activityLog: action.payload };

    default:
      return state;
  }
};

export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const updateActiveTask = useCallback(() => {
    const now = new Date();
    const nowInMinutes = now.getHours() * 60 + now.getMinutes();

    const currentTask = state.tasks.find((task) => {
      const start = timeToMinutes(task.startTime);
      const end = start + task.duration;
      return nowInMinutes >= start && nowInMinutes < end && !task.completed;
    });

    if (currentTask?.id !== state.activeTask?.id) {
      dispatch({ type: "SET_ACTIVE_TASK", payload: currentTask || null });
    }
  }, [state.tasks, state.activeTask]);

  // Wrapper for COMPLETE_TASK to handle gamification and confetti
  const completeTaskAndApplyGamification = (taskId: string) => {
    const completedAt = new Date().toISOString();
    dispatch({ type: "COMPLETE_TASK", payload: { taskId, completedAt } });

    // Play completion sound!
    playCompletionSound();

    // Show confetti celebration!
    dispatch({ type: "SHOW_CONFETTI" });

    // Update streak
    updateStreak();

    const task = state.tasks.find((t) => t.id === taskId);
    if (task) {
      const points = task.type === "Habit" ? 20 : 10;
      dispatch({ type: "ADD_POINTS", payload: points });

      // Log the activity
      dispatch({
        type: "LOG_ACTIVITY",
        payload: {
          id: `activity-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 9)}`,
          type: "task_completed",
          timestamp: completedAt,
          title: `Completed: ${task.title}`,
          details:
            task.type === "Habit" ? "Habit task" : `${task.duration} min task`,
          points,
        },
      });

      // We need to pass the next state to checkAndAwardBadges
      const nextState = appReducer(state, {
        type: "COMPLETE_TASK",
        payload: { taskId, completedAt },
      });
      checkAndAwardBadges(nextState, dispatch, task);
    }
  };

  const appContextValue = {
    state,
    dispatch: (action: AppAction) => {
      if (action.type === "COMPLETE_TASK") {
        completeTaskAndApplyGamification(action.payload.taskId);
      } else if (action.type === "ADD_TASK") {
        dispatch(action);
        // Log task creation
        dispatch({
          type: "LOG_ACTIVITY",
          payload: {
            id: `activity-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 9)}`,
            type: "task_created",
            timestamp: new Date().toISOString(),
            title: `Created: ${action.payload.title}`,
            details: `${action.payload.duration} min at ${action.payload.startTime}`,
          },
        });
      } else if (action.type === "LOG_HABIT") {
        dispatch(action);
        // Log habit completion
        if (action.payload.status === "done") {
          const habit = state.habits.find(
            (h) => h.id === action.payload.habitId
          );
          dispatch({
            type: "LOG_ACTIVITY",
            payload: {
              id: `activity-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 9)}`,
              type: "habit_logged",
              timestamp: new Date().toISOString(),
              title: `Habit: ${habit?.name || "Unknown"}`,
              details: "Marked as done",
              points: 5,
            },
          });
        }
      } else if (action.type === "START_FOCUS") {
        dispatch(action);
        // Log focus start
        dispatch({
          type: "LOG_ACTIVITY",
          payload: {
            id: `activity-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 9)}`,
            type: "focus_started",
            timestamp: new Date().toISOString(),
            title: `Focus: ${action.payload.title}`,
            details: `${action.payload.duration} min session`,
          },
        });
      } else if (action.type === "AWARD_BADGE") {
        dispatch(action);
        // Log badge earned
        dispatch({
          type: "LOG_ACTIVITY",
          payload: {
            id: `activity-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 9)}`,
            type: "badge_earned",
            timestamp: new Date().toISOString(),
            title: `Badge Earned: ${action.payload}`,
            points: 50,
          },
        });
      } else {
        dispatch(action);
      }
    },
  };

  useEffect(() => {
    try {
      const storedTasks = safeGetLocalStorage("focusflow-tasks");
      if (storedTasks) {
        try {
          dispatch({ type: "SET_TASKS", payload: JSON.parse(storedTasks) });
        } catch (e) {
          console.error("Failed to parse tasks:", e);
        }
      }

      const storedItems = safeGetLocalStorage("focusflow-saved-items");
      if (storedItems) {
        try {
          dispatch({
            type: "SET_SAVED_ITEMS",
            payload: JSON.parse(storedItems),
          });
        } catch (e) {
          console.error("Failed to parse saved items:", e);
        }
      }

      // Load habits and habit logs
      const storedHabits = safeGetLocalStorage("focusflow-habits");
      if (storedHabits) {
        try {
          dispatch({ type: "SET_HABITS", payload: JSON.parse(storedHabits) });
        } catch (e) {
          console.error("Failed to parse habits:", e);
        }
      }

      const storedHabitLogs = safeGetLocalStorage("focusflow-habit-logs");
      if (storedHabitLogs) {
        // Clean up old logs (> 90 days) to prevent localStorage bloat
        const rawLogs = JSON.parse(storedHabitLogs);
        const cleanedLogs = cleanupOldHabitLogs(rawLogs);
        dispatch({
          type: "SET_HABIT_LOGS",
          payload: cleanedLogs,
        });
        // Persist cleaned logs if any were removed
        if (cleanedLogs.length < rawLogs.length) {
          localStorage.setItem(
            "focusflow-habit-logs",
            JSON.stringify(cleanedLogs)
          );
        }
      }

      // Load activity log
      const storedActivityLog = localStorage.getItem("focusflow-activity-log");
      if (storedActivityLog) {
        dispatch({
          type: "SET_ACTIVITY_LOG",
          payload: JSON.parse(storedActivityLog),
        });
      }

      const lastVisit = localStorage.getItem("focusflow-last-visit");
      const today = new Date().toDateString();
      if (lastVisit !== today) {
        dispatch({ type: "RESET_DAILY_HABITS" });
        localStorage.setItem("focusflow-last-visit", today);
      }

      // Check for weekly recap - show cached recap or generate new one
      let habits = [];
      let habitLogs = [];

      if (storedHabits) {
        try {
          habits = JSON.parse(storedHabits);
        } catch (e) {
          console.error("Failed to parse habits for recap:", e);
        }
      }

      if (storedHabitLogs) {
        try {
          habitLogs = JSON.parse(storedHabitLogs);
        } catch (e) {
          console.error("Failed to parse habit logs for recap:", e);
        }
      }

      // First: Check if there's an unseen cached recap
      if (hasUnseenRecap()) {
        const cachedRecap = getPendingRecap();
        if (cachedRecap) {
          dispatch({ type: "SHOW_WEEKLY_RECAP", payload: cachedRecap });
        }
      }
      // Second: Generate new recap if conditions met (new week, not seen yet, has habits)
      else if (
        shouldShowWeeklyRecap() &&
        !hasSeenRecapThisWeek() &&
        habits.length > 0
      ) {
        const recap = generateWeeklyRecap(habits, habitLogs);
        cachePendingRecap(recap); // Cache it so user doesn't miss it
        dispatch({ type: "SHOW_WEEKLY_RECAP", payload: recap });
      }

      const focusSession = safeGetLocalStorage("focusSession");
      if (focusSession) {
        try {
          const { task, endTime } = JSON.parse(focusSession);
          if (endTime > Date.now()) {
            const remainingDuration = Math.ceil(
              (endTime - Date.now()) / (1000 * 60)
            );
            dispatch({
              type: "START_FOCUS",
              payload: { ...task, duration: remainingDuration },
            });
          } else {
            completeTaskAndApplyGamification(task.id);
            if (task.linkedItemId) {
              dispatch({
                type: "UPDATE_SAVED_ITEM",
                payload: { id: task.linkedItemId, status: "completed" },
              });
            }
            safeRemoveLocalStorage("focusSession");
          }
        } catch (e) {
          console.error("Failed to restore focus session:", e);
          safeRemoveLocalStorage("focusSession");
        }
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      safeSetLocalStorage("focusflow-tasks", JSON.stringify(state.tasks));
      safeSetLocalStorage(
        "focusflow-saved-items",
        JSON.stringify(state.savedItems)
      );
      safeSetLocalStorage("focusflow-habits", JSON.stringify(state.habits));
      safeSetLocalStorage(
        "focusflow-habit-logs",
        JSON.stringify(state.habitLogs)
      );
      safeSetLocalStorage(
        "focusflow-activity-log",
        JSON.stringify(state.activityLog)
      );
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [
    state.tasks,
    state.savedItems,
    state.habits,
    state.habitLogs,
    state.activityLog,
  ]);

  useEffect(() => {
    updateActiveTask();
    const interval = setInterval(updateActiveTask, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [updateActiveTask]);

  useEffect(() => {
    try {
      const root = window.document.documentElement;

      if (state.theme === "system") {
        const systemIsDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        root.classList.remove("light", "dark");
        root.classList.add(systemIsDark ? "dark" : "light");
        safeRemoveLocalStorage("theme");
      } else {
        root.classList.remove("light", "dark");
        root.classList.add(state.theme);
        safeSetLocalStorage("theme", state.theme);
      }

      // Force a reflow to ensure classes are applied
      void root.offsetHeight;
    } catch (error) {
      console.error("Failed to apply theme:", error);
    }
  }, [state.theme]);

  return (
    <AppContext.Provider value={appContextValue}>
      {children}
    </AppContext.Provider>
  );
};
