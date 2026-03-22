import React, { useState, useContext, useEffect } from "react";
import { Habit, HabitFrequencyType } from "../types.ts";
import { AppContext } from "../context/AppContext.tsx";
import { XMarkIcon } from "./icons.tsx";

interface AddHabitFormProps {
  editingHabit?: Habit | null;
  onClose: () => void;
}

const EMOJI_OPTIONS = [
  "💪",
  "🏃",
  "📚",
  "💧",
  "🧘",
  "✍️",
  "🎯",
  "⏰",
  "🍎",
  "💤",
  "🧹",
  "💰",
  "🎵",
  "🌱",
  "❤️",
  "🧠",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AddHabitForm: React.FC<AddHabitFormProps> = ({
  editingHabit,
  onClose,
}) => {
  const { dispatch } = useContext(AppContext);

  const [title, setTitle] = useState(editingHabit?.title || "");
  const [icon, setIcon] = useState(editingHabit?.icon || "💪");
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>(
    editingHabit?.frequencyType || "daily"
  );
  const [targetPerWeek, setTargetPerWeek] = useState(
    editingHabit?.targetPerWeek || 5
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    editingHabit?.daysOfWeek || [1, 2, 3, 4, 5] // Mon-Fri default
  );
  const [reminderTime, setReminderTime] = useState(
    editingHabit?.reminderTime || ""
  );
  const [streakFreezeEnabled, setStreakFreezeEnabled] = useState(
    editingHabit?.streakFreezeEnabled || false
  );

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Hard validation
    if (!title.trim()) {
      setError("Habit name is required");
      return;
    }
    if (frequencyType === "weekly" && targetPerWeek < 1) {
      setError("Weekly target must be at least 1");
      return;
    }
    if (frequencyType === "custom" && daysOfWeek.length < 1) {
      setError("Select at least one day for custom frequency");
      return;
    }

    const habitData: Habit = {
      id: editingHabit?.id || Date.now().toString(),
      title: title.trim(),
      icon,
      frequencyType,
      targetPerWeek: frequencyType === "weekly" ? targetPerWeek : undefined,
      daysOfWeek: frequencyType === "custom" ? daysOfWeek : undefined,
      reminderTime: reminderTime || undefined,
      createdAt: editingHabit?.createdAt || new Date().toISOString(),
      archived: editingHabit?.archived || false,
      streakFreezeEnabled,
    };

    if (editingHabit) {
      dispatch({ type: "UPDATE_HABIT", payload: habitData });
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: "Habit updated! ✓" },
      });
    } else {
      dispatch({ type: "ADD_HABIT", payload: habitData });
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: "Habit created! ✓" },
      });
    }

    onClose();
  };

  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  // Handle close with touch support
  const handleClose = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      onTouchEnd={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="bg-slate-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-white">
            {editingHabit ? "Edit Habit" : "New Habit"}
          </h2>
          <button
            onClick={handleClose}
            onTouchEnd={handleClose}
            className="p-3 rounded-lg hover:bg-slate-700/50 active:bg-slate-600/50 transition-colors touch-manipulation"
          >
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 space-y-5"
        >
          {/* Validation Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Habit Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Drink 8 glasses of water"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setIcon(emoji);
                  }}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all touch-manipulation ${
                    icon === emoji
                      ? "bg-indigo-600 ring-2 ring-indigo-400"
                      : "bg-slate-800 hover:bg-slate-700 active:bg-slate-600"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              How often?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFrequencyType("daily")}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setFrequencyType("daily");
                }}
                className={`py-3 px-4 rounded-xl font-medium transition-all touch-manipulation ${
                  frequencyType === "daily"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 active:bg-slate-600"
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType("weekly")}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setFrequencyType("weekly");
                }}
                className={`py-3 px-4 rounded-xl font-medium transition-all touch-manipulation ${
                  frequencyType === "weekly"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 active:bg-slate-600"
                }`}
              >
                X per week
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType("custom")}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setFrequencyType("custom");
                }}
                className={`py-3 px-4 rounded-xl font-medium transition-all touch-manipulation ${
                  frequencyType === "custom"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 active:bg-slate-600"
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Weekly Target */}
          {frequencyType === "weekly" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Times per week:{" "}
                <span className="text-indigo-400 font-bold">
                  {targetPerWeek}
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="7"
                value={targetPerWeek}
                onChange={(e) => setTargetPerWeek(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1</span>
                <span>7</span>
              </div>
            </div>
          )}

          {/* Custom Days */}
          {frequencyType === "custom" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select days
              </label>
              <div className="flex justify-between">
                {DAY_NAMES.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(index)}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      toggleDay(index);
                    }}
                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-all touch-manipulation ${
                      daysOfWeek.includes(index)
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 active:bg-slate-600"
                    }`}
                  >
                    {day.charAt(0)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reminder Time */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Reminder Time (optional)
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Streak Freeze Toggle */}
          {frequencyType === "daily" && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Streak Freeze ❄️</p>
                  <p className="text-sm text-slate-400">
                    Allow 1 missed day per week without breaking streak
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStreakFreezeEnabled(!streakFreezeEnabled)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setStreakFreezeEnabled(!streakFreezeEnabled);
                  }}
                  className={`w-12 h-6 rounded-full transition-all relative touch-manipulation ${
                    streakFreezeEnabled ? "bg-indigo-600" : "bg-slate-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                      streakFreezeEnabled ? "left-6" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            onTouchEnd={handleClose}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-slate-300 font-medium transition-colors touch-manipulation"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }}
            disabled={!title.trim()}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl text-white font-medium transition-colors touch-manipulation"
          >
            {editingHabit ? "Save Changes" : "Create Habit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddHabitForm;
