import React from "react";
import { DailySummary } from "../types.ts";
import { SparklesIcon } from "./icons.tsx";

interface DailySummaryCardProps {
  summary: DailySummary;
  onDismiss: () => void;
}

export default function DailySummaryCard({
  summary,
  onDismiss,
}: DailySummaryCardProps) {
  const completionRate =
    summary.totalTasks > 0
      ? Math.round((summary.tasksCompleted / summary.totalTasks) * 100)
      : 0;

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-6 h-6" />
          <h3 className="text-lg font-bold">Daily Summary</h3>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/70 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-3xl font-bold">
            {summary.tasksCompleted}/{summary.totalTasks}
          </p>
          <p className="text-sm text-white/70">Tasks</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">
            {summary.habitsCompleted}/{summary.totalHabits}
          </p>
          <p className="text-sm text-white/70">Habits</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{summary.focusMinutes}</p>
          <p className="text-sm text-white/70">Focus min</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Completion Rate</span>
          <span>{completionRate}%</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* AI Insights */}
      <div className="space-y-3 text-sm">
        <div className="bg-white/10 rounded-lg p-3">
          <p className="font-medium mb-1">🏆 Top Accomplishment</p>
          <p className="text-white/90">{summary.topAccomplishment}</p>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <p className="font-medium mb-1">💡 AI Insight</p>
          <p className="text-white/90 italic">{summary.aiInsight}</p>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <p className="font-medium mb-1">🎯 Tomorrow's Tip</p>
          <p className="text-white/90">{summary.suggestionForTomorrow}</p>
        </div>
      </div>
    </div>
  );
}
