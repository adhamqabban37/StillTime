import React, { useContext } from "react";
import { HabitWithStats, HabitLog } from "../types.ts";
import { AppContext } from "../context/AppContext.tsx";
import {
  XMarkIcon,
  FireIcon,
  TrophyIcon,
  SparklesIcon,
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
} from "./icons.tsx";
import HabitCalendar from "./HabitCalendar.tsx";

interface HabitDetailModalProps {
  habit: HabitWithStats;
  logs: HabitLog[];
  onClose: () => void;
  onEdit: () => void;
}

const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  habit,
  logs,
  onClose,
  onEdit,
}) => {
  const { dispatch } = useContext(AppContext);
  const habitLogs = logs.filter((l) => l.habitId === habit.id);

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${habit.title}"? This will also delete all history.`
      )
    ) {
      dispatch({ type: "DELETE_HABIT", payload: habit.id });
      onClose();
    }
  };

  const handleArchive = () => {
    dispatch({ type: "ARCHIVE_HABIT", payload: habit.id });
    dispatch({
      type: "SHOW_TOAST",
      payload: {
        message: `"${habit.title}" archived ✓`,
      },
    });
    onClose();
  };

  const getFrequencyLabel = () => {
    if (habit.frequencyType === "daily") return "Every day";
    if (habit.frequencyType === "weekly")
      return `${habit.targetPerWeek}x per week`;
    if (habit.frequencyType === "custom" && habit.daysOfWeek) {
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      return habit.daysOfWeek.map((d) => dayNames[d]).join(", ");
    }
    return "";
  };

  // Calculate total completions
  const totalCompletions = habitLogs.filter((l) => l.status === "done").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{habit.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{habit.title}</h2>
              <p className="text-sm text-slate-400">{getFrequencyLabel()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl p-3 border border-orange-500/30">
              <div className="flex items-center gap-2 mb-1">
                <FireIcon className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-orange-400 font-medium">
                  Current
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {habit.currentStreak}
              </p>
              <p className="text-xs text-slate-400">
                {habit.frequencyType === "weekly" ? "weeks" : "days"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-1">
                <TrophyIcon className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-400 font-medium">
                  Best
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {habit.longestStreak}
              </p>
              <p className="text-xs text-slate-400">
                {habit.frequencyType === "weekly" ? "weeks" : "days"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-xl p-3 border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-1">
                <SparklesIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-indigo-400 font-medium">
                  Rate
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {Math.round(habit.completionRate)}%
              </p>
              <p className="text-xs text-slate-400">last 30 days</p>
            </div>
          </div>

          {/* Total Completions */}
          <div className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-slate-400">Total Completions</span>
            <span className="text-xl font-bold text-white">
              {totalCompletions}
            </span>
          </div>

          {/* Calendar */}
          <HabitCalendar habit={habit} logs={habitLogs} />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700/50 flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleArchive}
            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-colors"
            title="Archive"
          >
            <ArchiveBoxIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-3 bg-red-600/20 hover:bg-red-600/40 rounded-xl text-red-400 transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitDetailModal;
