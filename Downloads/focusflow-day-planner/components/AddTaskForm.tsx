import React, { useState, useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext.tsx";
import { Task, TaskType, TaskCategory } from "../types.ts";
import { DAY_START_HOUR, DAY_END_HOUR, CATEGORY_CONFIG } from "../constants.ts";
import { useGemini } from "../hooks/useGemini.ts";
import { SparklesIcon, XMarkIcon } from "./icons.tsx";
import {
  scheduleNotification,
  cancelAllNotifications,
} from "../logic/notifications.ts";

export default function AddTaskForm() {
  const { state, dispatch } = useContext(AppContext);
  const { editingTask, taskDefaults } = state;

  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("Task");
  const [category, setCategory] = useState<TaskCategory | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [linkedItemId, setLinkedItemId] = useState<string | undefined>(
    undefined
  );
  const [error, setError] = useState<string | null>(null);

  const {
    getTaskSuggestions,
    isLoading: isGeminiLoading,
    error: geminiError,
  } = useGemini();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setType(editingTask.type);
      setCategory(editingTask.category);
      setNotes(editingTask.notes || "");
      setDuration(editingTask.duration);
      setStartTime(editingTask.startTime);
      setLinkedItemId(editingTask.linkedItemId);
    } else if (taskDefaults) {
      setTitle(taskDefaults.title || "");
      setType(taskDefaults.type || "Task");
      setCategory(taskDefaults.category);
      setNotes("");
      setDuration(taskDefaults.duration || 30);
      setStartTime(taskDefaults.startTime || "09:00");
      setLinkedItemId(taskDefaults.linkedItemId);
    } else {
      // Reset form for a new blank task
      setTitle("");
      setType("Task");
      setCategory(undefined);
      setNotes("");
      setDuration(0);
      setStartTime("");
      setLinkedItemId(undefined);
    }
    setSuggestions([]);
  }, [editingTask, taskDefaults]);

  const handleClose = () => {
    dispatch({ type: "TOGGLE_ADD_TASK_FORM", payload: { isOpen: false } });
    dispatch({ type: "SET_EDITING_TASK", payload: null });
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const scheduleTaskNotifications = (task: Task) => {
    if (state.notificationPermission !== "granted") return;

    const [hour, minute] = task.startTime.split(":").map(Number);
    const taskStartDate = new Date();
    taskStartDate.setHours(hour, minute, 0, 0);
    const taskStartTime = taskStartDate.getTime();

    // Reminder notification 5 minutes before
    scheduleNotification(
      "Task starting soon",
      {
        body: `"${task.title}" begins in 5 minutes.`,
        tag: `${task.id}-reminder`,
      },
      taskStartTime - 5 * 60 * 1000
    );

    // Start notification
    scheduleNotification(
      "Time to start your task!",
      { body: `It's time for "${task.title}".`, tag: `${task.id}-start` },
      taskStartTime
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Use defaults if not provided
    const finalDuration = duration || 30;
    const finalStartTime = startTime || "09:00";

    const newTaskData = {
      title,
      type,
      category,
      notes: notes.trim() || undefined,
      duration: finalDuration,
      startTime: finalStartTime,
      recurrence: "none", // Simplified for MVP
      linkedItemId,
    };

    const newTask: Task = editingTask
      ? { ...editingTask, ...newTaskData }
      : { ...newTaskData, id: new Date().toISOString(), completed: false };

    // Only do collision/time validation if user explicitly set a time
    if (startTime) {
      const newTaskStart = timeToMinutes(newTask.startTime);
      const newTaskEnd = newTaskStart + newTask.duration;

      // Collision detection
      const hasCollision = state.tasks.some((task) => {
        if (editingTask && task.id === editingTask.id) return false;
        const existingTaskStart = timeToMinutes(task.startTime);
        const existingTaskEnd = existingTaskStart + task.duration;
        return (
          Math.max(newTaskStart, existingTaskStart) <
          Math.min(newTaskEnd, existingTaskEnd)
        );
      });

      if (hasCollision) {
        setError("This task overlaps with an existing task.");
        return;
      }

      if (
        timeToMinutes(finalStartTime) < DAY_START_HOUR * 60 ||
        timeToMinutes(finalStartTime) + finalDuration > DAY_END_HOUR * 60
      ) {
        setError("Task must be scheduled between 8:00 AM and 6:00 PM.");
        return;
      }
    }

    if (editingTask) {
      dispatch({ type: "UPDATE_TASK", payload: newTask });
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: "Task updated! ✓", icon: "✏️" },
      });
    } else {
      dispatch({ type: "ADD_TASK", payload: newTask });
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: "Task added! ✓", icon: "✅" },
      });
    }

    // For simplicity, we'll just reschedule all notifications.
    // A more robust solution would cancel/update only the relevant ones.
    cancelAllNotifications();
    [...state.tasks, newTask].forEach(scheduleTaskNotifications);

    // If this task was created from a saved item, update the item's status
    if (linkedItemId) {
      dispatch({
        type: "UPDATE_SAVED_ITEM",
        payload: { id: linkedItemId, status: "scheduled" },
      });
    }

    // Close the form after successful submission
    dispatch({ type: "TOGGLE_ADD_TASK_FORM", payload: { isOpen: false } });
  };

  const handleGetSuggestions = async () => {
    if (!title.trim()) return;
    const result = await getTaskSuggestions(title);
    setSuggestions(result);
  };

  const addSuggestedTask = (suggestedTitle: string) => {
    const suggestedTask: Task = {
      id: new Date().toISOString(),
      title: suggestedTitle,
      type: "Task",
      duration: 30,
      startTime: "09:00",
      recurrence: "none",
      completed: false,
    };
    dispatch({ type: "ADD_TASK", payload: suggestedTask });
    setSuggestions(suggestions.filter((s) => s !== suggestedTitle));
  };

  // Handle backdrop click/touch
  const handleBackdropInteraction = (
    e: React.MouseEvent | React.TouchEvent
  ) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
      onClick={handleBackdropInteraction}
      onTouchEnd={handleBackdropInteraction}
    >
      <div
        className="bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Close button - larger touch target */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClose();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClose();
          }}
          className="absolute top-3 right-3 w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-100 active:text-white cursor-pointer hover:bg-slate-700 active:bg-slate-600 rounded-xl transition-colors z-20 touch-manipulation"
          aria-label="Close"
        >
          <XMarkIcon className="w-7 h-7" />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-semibold text-slate-100">
              {editingTask ? "Edit Task" : "Add New Task"}
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-slate-300"
              >
                Title
              </label>
              <div className="mt-1 flex rounded-xl shadow-sm overflow-hidden">
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 block w-full rounded-none rounded-l-xl border-0 bg-slate-800/50 focus:ring-2 focus:ring-indigo-500 sm:text-sm text-slate-100 placeholder:text-slate-500 px-4 py-3"
                  required
                />
                <button
                  type="button"
                  onClick={handleGetSuggestions}
                  disabled={isGeminiLoading || !title}
                  className="inline-flex items-center border-0 bg-slate-800 px-4 text-sm text-slate-400 hover:bg-slate-700 hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Get smart suggestions"
                >
                  {isGeminiLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin"></div>
                  ) : (
                    <SparklesIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {geminiError && (
              <p className="text-sm text-red-600">{geminiError}</p>
            )}
            {suggestions.length > 0 && (
              <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5">
                <h4 className="text-sm font-medium text-slate-300 mb-2">
                  Suggestions:
                </h4>
                <ul className="space-y-2">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-200">{s}</span>
                      <button
                        type="button"
                        onClick={() => addSuggestedTask(s)}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs"
                      >
                        + ADD
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Type
              </label>
              <div className="mt-1 grid grid-cols-2 gap-2 rounded-xl bg-slate-800/50 p-1">
                <button
                  type="button"
                  onClick={() => setType("Task")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    type === "Task"
                      ? "bg-slate-700 shadow-sm text-indigo-400"
                      : "text-slate-400 hover:bg-slate-700/50"
                  }`}
                >
                  Task
                </button>
                <button
                  type="button"
                  onClick={() => setType("Habit")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    type === "Habit"
                      ? "bg-slate-700 shadow-sm text-teal-400"
                      : "text-slate-400 hover:bg-slate-700/50"
                  }`}
                >
                  Habit
                </button>
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CATEGORY_CONFIG) as TaskCategory[]).map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(isSelected ? undefined : cat)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                        isSelected
                          ? `${config.darkBgColor} ${config.color} ring-2 ring-offset-1 ring-offset-slate-900 ring-current`
                          : "bg-slate-800/50 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-slate-300"
              >
                Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional details or notes..."
                rows={3}
                className="mt-1 block w-full rounded-xl border-0 bg-slate-800/50 shadow-sm focus:ring-2 focus:ring-indigo-500/50 sm:text-sm text-slate-100 placeholder-slate-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-slate-300"
                >
                  Duration (min){" "}
                  <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  id="duration"
                  value={duration || ""}
                  onChange={(e) =>
                    setDuration(
                      e.target.value ? parseInt(e.target.value, 10) : 0
                    )
                  }
                  placeholder="30"
                  className="mt-1 block w-full rounded-xl border-0 bg-slate-800/50 shadow-sm focus:ring-2 focus:ring-indigo-500/50 sm:text-sm text-slate-100 placeholder-slate-500"
                  min="5"
                  step="5"
                />
              </div>
              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-slate-300"
                >
                  Start Time{" "}
                  <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 block w-full rounded-xl border-0 bg-slate-800/50 shadow-sm focus:ring-2 focus:ring-indigo-500/50 sm:text-sm text-slate-100 [color-scheme:dark]"
                  step="300"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="p-4 bg-slate-900/50 border-t border-white/5 rounded-b-xl flex justify-between gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              className="px-5 py-3 text-slate-400 hover:text-slate-200 active:text-white bg-slate-800/50 hover:bg-slate-700/50 active:bg-slate-600/50 rounded-xl transition-colors font-medium touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
            >
              {editingTask ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
