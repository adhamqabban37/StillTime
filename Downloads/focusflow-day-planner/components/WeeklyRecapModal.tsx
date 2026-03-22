import React, { useContext } from "react";
import { WeeklyHabitRecap } from "../types.ts";
import { AppContext } from "../context/AppContext.tsx";
import { XMarkIcon, TrophyIcon, FireIcon, SparklesIcon } from "./icons.tsx";
import { markRecapAsSeen } from "../logic/habitUtils.ts";

interface WeeklyRecapModalProps {
  recap: WeeklyHabitRecap;
  onClose: () => void;
}

const WeeklyRecapModal: React.FC<WeeklyRecapModalProps> = ({
  recap,
  onClose,
}) => {
  const { dispatch } = useContext(AppContext);

  const handleClose = () => {
    markRecapAsSeen(); // Mark as seen and clear cached recap
    dispatch({ type: "HIDE_WEEKLY_RECAP" });
    onClose();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getPerformanceEmoji = (rate: number) => {
    if (rate >= 90) return "🏆";
    if (rate >= 70) return "🎯";
    if (rate >= 50) return "💪";
    return "🌱";
  };

  const getPerformanceMessage = (rate: number) => {
    if (rate >= 90) return "Outstanding week! You're crushing it!";
    if (rate >= 70) return "Great job! Keep up the momentum!";
    if (rate >= 50) return "Good progress! Room for improvement.";
    return "Every step counts! Let's do better this week.";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-white/80" />
          </button>

          <div className="text-5xl mb-3">
            {getPerformanceEmoji(recap.overallCompletionRate)}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Weekly Recap</h2>
          <p className="text-indigo-200 text-sm">
            {formatDate(recap.weekStart)} - {formatDate(recap.weekEnd)}
          </p>
        </div>

        {/* Overall Stats */}
        <div className="p-4 bg-slate-800/50 border-b border-slate-700/50">
          <div className="flex items-center justify-center gap-3">
            <SparklesIcon className="w-6 h-6 text-indigo-400" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                {Math.round(recap.overallCompletionRate)}%
              </p>
              <p className="text-sm text-slate-400">Overall Completion</p>
            </div>
          </div>
          <p className="text-center text-slate-300 mt-3 text-sm">
            {getPerformanceMessage(recap.overallCompletionRate)}
          </p>
        </div>

        {/* Habits Breakdown */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h3 className="text-sm font-medium text-slate-400 mb-2">
            Habits Breakdown
          </h3>

          {recap.habits.map((habitStat) => (
            <div
              key={habitStat.habitId}
              className="bg-slate-800/50 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{habitStat.habitIcon}</span>
                  <span className="font-medium text-white">
                    {habitStat.habitTitle}
                  </span>
                </div>
                <span
                  className={`text-sm font-bold ${
                    habitStat.completionRate >= 80
                      ? "text-green-400"
                      : habitStat.completionRate >= 50
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {Math.round(habitStat.completionRate)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      habitStat.completionRate >= 80
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : habitStat.completionRate >= 50
                        ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                        : "bg-gradient-to-r from-red-500 to-orange-500"
                    }`}
                    style={{ width: `${habitStat.completionRate}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-12 text-right">
                  {habitStat.completed}/{habitStat.expected}
                </span>
              </div>
            </div>
          ))}

          {/* Best Habit */}
          {recap.bestHabit && (
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-1">
                <TrophyIcon className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">
                  Best Habit
                </span>
              </div>
              <p className="text-white font-semibold">{recap.bestHabit}</p>
            </div>
          )}

          {/* Needs Improvement */}
          {recap.needsWorkHabit && (
            <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-xl p-4 border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-1">
                <FireIcon className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-medium text-indigo-400">
                  Focus This Week
                </span>
              </div>
              <p className="text-white font-semibold">{recap.needsWorkHabit}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={handleClose}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-colors"
          >
            Start This Week Strong! 💪
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyRecapModal;
