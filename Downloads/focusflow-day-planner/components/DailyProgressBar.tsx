import React, { useContext } from "react";
import { AppContext } from "../context/AppContext.tsx";

export default function DailyProgressBar() {
  const { state } = useContext(AppContext);

  // Get today's date string for comparison
  const today = new Date().toDateString();

  // Filter tasks for today (non-habit tasks or habits that need daily completion)
  const todaysTasks = state.tasks.filter((task) => {
    // Include all tasks (both habits and regular tasks count toward daily progress)
    return true;
  });

  const totalTasks = todaysTasks.length;
  const completedTasks = todaysTasks.filter((task) => task.completed).length;

  // Calculate percentage
  const percentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Determine color based on progress
  const getProgressColor = () => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 50) return "bg-indigo-500";
    if (percentage >= 25) return "bg-amber-500";
    return "bg-slate-400";
  };

  // Get motivational message
  const getMessage = () => {
    if (totalTasks === 0) return "Add tasks to track your progress!";
    if (percentage === 100) return "🎉 All done! Amazing work!";
    if (percentage >= 80) return "🔥 Almost there! Keep it up!";
    if (percentage >= 50) return "💪 Halfway done! You got this!";
    if (percentage >= 25) return "🚀 Great start! Keep going!";
    return "📋 Let's get started!";
  };

  if (totalTasks === 0) {
    return null; // Don't show if no tasks
  }

  return (
    <div className="bg-slate-900/40 rounded-2xl shadow-lg p-4 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-300">
          Today's Progress
        </h3>
        <span className="text-lg font-bold text-slate-100">{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stats and message */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-slate-400">
          {completedTasks} of {totalTasks} tasks completed
        </p>
        <p className="text-xs font-medium text-slate-300">{getMessage()}</p>
      </div>
    </div>
  );
}
