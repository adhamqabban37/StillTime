import React from "react";
import { HabitWithStats, HabitLogStatus } from "../types.ts";
import { CheckCircleIcon, FireIcon, SparklesIcon } from "./icons.tsx";

interface HabitCheckItemProps {
  habit: HabitWithStats;
  onToggle: (habitId: string, status: HabitLogStatus) => void;
  onPress: (habit: HabitWithStats) => void;
}

const HabitCheckItem: React.FC<HabitCheckItemProps> = ({
  habit,
  onToggle,
  onPress,
}) => {
  const isChecked = habit.todayStatus === "done";
  const isRestDay = !habit.isExpectedToday;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRestDay) return; // Can't toggle on rest days
    const newStatus: HabitLogStatus = isChecked ? "missed" : "done";
    onToggle(habit.id, newStatus);
  };

  const getFrequencyLabel = () => {
    if (habit.frequencyType === "daily") return "Every day";
    if (habit.frequencyType === "weekly") return `${habit.targetPerWeek}x/week`;
    if (habit.frequencyType === "custom" && habit.daysOfWeek) {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return habit.daysOfWeek.map((d) => dayNames[d]).join(", ");
    }
    return "";
  };

  return (
    <div
      onClick={() => onPress(habit)}
      className={`relative rounded-xl p-4 transition-all cursor-pointer
        ${
          isChecked
            ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
            : isRestDay
            ? "bg-slate-700/30 border border-slate-600/30 opacity-60"
            : "bg-slate-700/50 border border-slate-600/50 hover:border-indigo-500/50"
        }`}
    >
      <div className="flex items-center gap-4">
        {/* Check Button */}
        <button
          onClick={handleToggle}
          disabled={isRestDay}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
            ${
              isChecked
                ? "bg-green-500 text-white"
                : isRestDay
                ? "bg-slate-600/50 text-slate-500 cursor-not-allowed"
                : "bg-slate-600 text-slate-300 hover:bg-indigo-500 hover:text-white"
            }`}
        >
          {isChecked ? (
            <CheckCircleIcon className="w-6 h-6" />
          ) : (
            <span className="text-xl">{habit.icon}</span>
          )}
        </button>

        {/* Habit Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={`font-semibold ${
                isChecked
                  ? "text-green-400 line-through"
                  : isRestDay
                  ? "text-slate-500"
                  : "text-white"
              }`}
            >
              {habit.title}
            </h3>
            {isRestDay && (
              <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
                Rest day
              </span>
            )}
            {habit.streakFreezeEnabled && (
              <span className="text-xs" title="Streak freeze enabled">
                ❄️
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">{getFrequencyLabel()}</p>
        </div>

        {/* Streak Badge */}
        {habit.currentStreak > 0 && (
          <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500/20 to-amber-500/20 px-3 py-1.5 rounded-full border border-orange-500/30">
            <FireIcon className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-400">
              {habit.currentStreak}
            </span>
          </div>
        )}

        {/* Completion Rate */}
        <div className="hidden sm:flex items-center gap-1 text-sm text-slate-400">
          <SparklesIcon className="w-4 h-4" />
          <span>{Math.round(habit.completionRate)}%</span>
        </div>
      </div>

      {/* Weekly Goal Dots Visualization */}
      {habit.frequencyType === "weekly" && habit.targetPerWeek && (
        <div className="mt-3 pt-3 border-t border-slate-600/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">This week</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: habit.targetPerWeek }).map((_, i) => {
                const isFilled = i < (habit.completionsThisWeek || 0);
                return (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      isFilled
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 shadow-sm shadow-green-500/50"
                        : "bg-slate-600/50 border border-slate-500/50"
                    }`}
                  />
                );
              })}
              <span className="ml-2 text-xs text-slate-400">
                {habit.completionsThisWeek || 0}/{habit.targetPerWeek}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitCheckItem;
