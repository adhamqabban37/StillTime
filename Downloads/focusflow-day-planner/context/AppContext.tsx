import React, {
  createContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { Preferences } from "@capacitor/preferences";
import { WidgetBridge } from "../logic/widgetBridge.ts";
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
  Idea,
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

const THEME_STORAGE_KEY = "theme";

const initialState: AppState = {
  tasks: [],
  savedItems: [],
  habits: [],
  habitLogs: [],
  goals: [],
  goalLogs: [],
  ideas: [],
  activityLog: [],
  isAddTaskFormOpen: false,
  isAddHabitFormOpen: false,
  isAddGoalFormOpen: false,
  isAddIdeaFormOpen: false,
  editingHabit: null,
  selectedHabit: null,
  editingGoal: null,
  selectedGoal: null,
  focusedTask: null,
  editingTask: null,
  editingIdea: null,
  selectedIdeaTopic: "all",
  mode: "Home",
  activeTask: null,
  controlPanelTask: null,
  actionPanelItem: null,
  taskDefaults: null,
  theme: (() => {
    // Read theme from localStorage or check current document class
    const storedTheme = safeGetLocalStorage(THEME_STORAGE_KEY) as Theme;
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
  autopilotEnabled: false,
  calendarEvents: [],
  googleCalendarConnected: false,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_TASKS":
      return { ...state, tasks: action.payload };
    case "ADD_TASK":
      return {
        ...state,
        tasks: [...state.tasks, action.payload].sort((a, b) =>
          a.startTime.localeCompare(b.startTime),
        ),
      };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks
          .map((task) =>
            task.id === action.payload.id ? action.payload : task,
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
        JSON.stringify({ task: action.payload, endTime: sessionEnd }),
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
            : t,
        ),
      };
    case "UNCOMPLETE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload
            ? { ...t, completed: false, completedAt: undefined }
            : t,
        ),
      };
    case "RESTORE_BACKUP":
      return { ...state, ...action.payload };
    case "RESET_DAILY_HABITS":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.type === "Habit" && t.recurrence === "daily"
            ? { ...t, completed: false, completedAt: undefined }
            : t,
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
          item.id === action.payload.id ? { ...item, ...action.payload } : item,
        ),
      };
    case "DELETE_SAVED_ITEM":
      return {
        ...state,
        savedItems: state.savedItems.filter(
          (item) => item.id !== action.payload,
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
          h.id === action.payload.id ? action.payload : h,
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
          h.id === action.payload ? { ...h, archived: true } : h,
        ),
      };
    case "SET_HABIT_LOGS":
      return { ...state, habitLogs: action.payload };
    case "LOG_HABIT": {
      const existingIndex = state.habitLogs.findIndex(
        (l) =>
          l.habitId === action.payload.habitId &&
          l.date === action.payload.date,
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
            ),
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

    // Goal Actions
    case "SET_GOALS":
      return { ...state, goals: action.payload };
    case "ADD_GOAL":
      return { ...state, goals: [...state.goals, action.payload] };
    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? action.payload : g,
        ),
      };
    case "DELETE_GOAL":
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
        goalLogs: state.goalLogs.filter((l) => l.habitId !== action.payload),
      };
    case "ARCHIVE_GOAL":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload ? { ...g, archived: true } : g,
        ),
      };
    case "SET_GOAL_LOGS":
      return { ...state, goalLogs: action.payload };
    case "LOG_GOAL": {
      const existingIndex = state.goalLogs.findIndex(
        (l) =>
          l.habitId === action.payload.habitId &&
          l.date === action.payload.date,
      );
      if (existingIndex >= 0) {
        const updatedLogs = [...state.goalLogs];
        updatedLogs[existingIndex] = action.payload;
        return { ...state, goalLogs: updatedLogs };
      }
      return { ...state, goalLogs: [...state.goalLogs, action.payload] };
    }
    case "REMOVE_GOAL_LOG":
      return {
        ...state,
        goalLogs: state.goalLogs.filter(
          (l) =>
            !(
              l.habitId === action.payload.habitId &&
              l.date === action.payload.date
            ),
        ),
      };
    case "TOGGLE_ADD_GOAL_FORM":
      return { ...state, isAddGoalFormOpen: action.payload };
    case "SET_EDITING_GOAL":
      return { ...state, editingGoal: action.payload };
    case "SET_SELECTED_GOAL":
      return { ...state, selectedGoal: action.payload };

    // Activity Log
    case "LOG_ACTIVITY":
      // Keep only last 100 entries to prevent localStorage bloat
      const newLog = [action.payload, ...state.activityLog].slice(0, 100);
      return { ...state, activityLog: newLog };
    case "SET_ACTIVITY_LOG":
      return { ...state, activityLog: action.payload };

    // Ideas Journal
    case "SET_IDEAS":
      return { ...state, ideas: action.payload };
    case "ADD_IDEA":
      return {
        ...state,
        ideas: [action.payload, ...state.ideas],
      };
    case "UPDATE_IDEA":
      return {
        ...state,
        ideas: state.ideas.map((idea) =>
          idea.id === action.payload.id ? action.payload : idea,
        ),
      };
    case "DELETE_IDEA":
      return {
        ...state,
        ideas: state.ideas.filter((idea) => idea.id !== action.payload),
      };
    case "TOGGLE_ADD_IDEA_FORM":
      return {
        ...state,
        isAddIdeaFormOpen: action.payload,
        editingIdea: action.payload ? null : state.editingIdea,
        activeModal: action.payload ? "addIdea" : null,
      };
    case "SET_EDITING_IDEA":
      return {
        ...state,
        editingIdea: action.payload,
        isAddIdeaFormOpen: !!action.payload,
        activeModal: action.payload ? "addIdea" : null,
      };
    case "SET_SELECTED_IDEA_TOPIC":
      return { ...state, selectedIdeaTopic: action.payload };

    case "SET_AUTOPILOT":
      return { ...state, autopilotEnabled: action.payload };
    case "SET_CALENDAR_EVENTS":
      return { ...state, calendarEvents: action.payload };
    case "SET_GOOGLE_CALENDAR_CONNECTED":
      return { ...state, googleCalendarConnected: action.payload };

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
  const migratedGoalsRef = useRef(false);

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
            (h) => h.id === action.payload.habitId,
          );
          dispatch({
            type: "LOG_ACTIVITY",
            payload: {
              id: `activity-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 9)}`,
              type: "habit_logged",
              timestamp: new Date().toISOString(),
              title: `Habit: ${habit?.title || "Unknown"}`,
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

  // One-time migration: fold legacy accountability goals into the unified habits system.
  useEffect(() => {
    if (migratedGoalsRef.current) return;
    if (state.goals.length === 0 && state.goalLogs.length === 0) {
      migratedGoalsRef.current = true;
      return;
    }

    const existingHabitIds = new Set(state.habits.map((h) => h.id));
    const mergedHabits = [...state.habits];

    for (const goal of state.goals) {
      if (!existingHabitIds.has(goal.id)) {
        mergedHabits.push(goal);
      }
    }

    const logKey = (l: HabitLog) => `${l.habitId}|${l.date}`;
    const existingLogKeys = new Set(state.habitLogs.map(logKey));
    const mergedLogs = [...state.habitLogs];

    for (const log of state.goalLogs) {
      const key = logKey(log);
      if (!existingLogKeys.has(key)) {
        mergedLogs.push(log);
      }
    }

    dispatch({ type: "SET_HABITS", payload: mergedHabits });
    dispatch({ type: "SET_HABIT_LOGS", payload: mergedLogs });
    dispatch({ type: "SET_GOALS", payload: [] });
    dispatch({ type: "SET_GOAL_LOGS", payload: [] });
    dispatch({
      type: "SHOW_TOAST",
      payload: { message: "Merged Accountability into Habits." },
    });

    migratedGoalsRef.current = true;
  }, [state.goals, state.goalLogs, state.habits, state.habitLogs]);

  useEffect(() => {
    let cancelled = false;

    const loadThemePreference = async () => {
      try {
        const { value } = await Preferences.get({ key: THEME_STORAGE_KEY });
        if (cancelled) return;
        if (value === "light" || value === "dark" || value === "system") {
          dispatch({ type: "SET_THEME", payload: value as Theme });
        }
      } catch (error) {
        console.warn("Failed to read theme preference:", error);
      }
    };

    loadThemePreference();

    return () => {
      cancelled = true;
    };
  }, []);

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
            JSON.stringify(cleanedLogs),
          );
        }
      }
      // Load goals
      const storedGoals = safeGetLocalStorage("focusflow-goals");
      if (storedGoals) {
        try {
          dispatch({ type: "SET_GOALS", payload: JSON.parse(storedGoals) });
        } catch (e) {
          console.error("Failed to parse goals:", e);
        }
      }

      const storedGoalLogs = safeGetLocalStorage("focusflow-goal-logs");
      if (storedGoalLogs) {
        const rawLogs = JSON.parse(storedGoalLogs);
        const cleanedLogs = cleanupOldHabitLogs(rawLogs);
        dispatch({
          type: "SET_GOAL_LOGS",
          payload: cleanedLogs,
        });
        if (cleanedLogs.length < rawLogs.length) {
          localStorage.setItem(
            "focusflow-goal-logs",
            JSON.stringify(cleanedLogs),
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

      // Load ideas
      const storedIdeas = safeGetLocalStorage("focusflow-ideas");
      if (storedIdeas) {
        try {
          dispatch({ type: "SET_IDEAS", payload: JSON.parse(storedIdeas) });
        } catch (e) {
          console.error("Failed to parse ideas:", e);
        }
      }

      const storedAutopilot = safeGetLocalStorage("focusflow-autopilot");
      if (storedAutopilot) {
        try {
          dispatch({
            type: "SET_AUTOPILOT",
            payload: JSON.parse(storedAutopilot),
          });
        } catch (e) {
          console.error("Failed to parse autopilot setting:", e);
        }
      }

      const storedGCalConnected = safeGetLocalStorage(
        "focusflow-google-calendar-connected",
      );
      if (storedGCalConnected) {
        try {
          dispatch({
            type: "SET_GOOGLE_CALENDAR_CONNECTED",
            payload: JSON.parse(storedGCalConnected),
          });
        } catch (e) {
          console.error("Failed to parse google calendar setting:", e);
        }
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
              (endTime - Date.now()) / (1000 * 60),
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
      WidgetBridge.syncState(state);
      safeSetLocalStorage(
        "focusflow-saved-items",
        JSON.stringify(state.savedItems),
      );
      safeSetLocalStorage("focusflow-habits", JSON.stringify(state.habits));
      safeSetLocalStorage(
        "focusflow-habit-logs",
        JSON.stringify(state.habitLogs),
      );
      safeSetLocalStorage(
        "focusflow-activity-log",
        JSON.stringify(state.activityLog),
      );
      safeSetLocalStorage("focusflow-ideas", JSON.stringify(state.ideas));
      safeSetLocalStorage("focusflow-goals", JSON.stringify(state.goals));
      safeSetLocalStorage(
        "focusflow-goal-logs",
        JSON.stringify(state.goalLogs),
      );
      safeSetLocalStorage(
        "focusflow-autopilot",
        JSON.stringify(state.autopilotEnabled),
      );
      safeSetLocalStorage(
        "focusflow-google-calendar-connected",
        JSON.stringify(state.googleCalendarConnected),
      );
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [
    state.tasks,
    state.savedItems,
    state.habits,
    state.habitLogs,
    state.goals,
    state.goalLogs,
    state.activityLog,
    state.ideas,
    state.autopilotEnabled,
    state.googleCalendarConnected,
  ]);

  useEffect(() => {
    const interval = setInterval(updateActiveTask, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [updateActiveTask]);

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      const body = window.document.body;
      const systemMedia = window.matchMedia("(prefers-color-scheme: dark)");

      const applyTheme = (theme: Theme) => {
        const resolvedTheme =
          theme === "system" ? (systemMedia.matches ? "dark" : "light") : theme;

        root.classList.remove("light", "dark");
        root.classList.add(resolvedTheme);
        body.classList.remove("light", "dark");
        body.classList.add(resolvedTheme);
        root.style.colorScheme = resolvedTheme;
      };

      applyTheme(state.theme);

      const onSystemThemeChanged = () => {
        if (state.theme === "system") {
          applyTheme("system");
        }
      };

      if (state.theme === "system") {
        systemMedia.addEventListener("change", onSystemThemeChanged);
      }

      if (state.theme === "system") {
        safeRemoveLocalStorage(THEME_STORAGE_KEY);
        Preferences.remove({ key: THEME_STORAGE_KEY }).catch((error) => {
          console.warn("Failed to clear theme preference:", error);
        });
      } else {
        safeSetLocalStorage(THEME_STORAGE_KEY, state.theme);
        Preferences.set({ key: THEME_STORAGE_KEY, value: state.theme }).catch(
          (error) => {
            console.warn("Failed to persist theme preference:", error);
          },
        );
      }

      // Force a reflow to ensure classes are applied
      void root.offsetHeight;

      return () => {
        systemMedia.removeEventListener("change", onSystemThemeChanged);
      };
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
