import React, { useContext, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext.tsx";
import {
  calculateProductivityScore,
  getWeeklyCompletionData,
  getHeatmapData,
  calculateHabitStreaksFromData,
} from "../logic/analytics.ts";
import { exportAllData } from "../logic/exportData.ts";
import { BADGES } from "../constants.ts";
import { FireIcon, SparklesIcon, TrophyIcon } from "../components/icons.tsx";
import { ActivityLogEntry } from "../types.ts";

// Icons
const TargetIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const MedalIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
    <path d="M12 2v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M12 20v2" />
    <path d="m19.07 4.93-1.41 1.41" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
  </svg>
);

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const LayoutIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// Helper to format relative time
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Activity type to icon/color mapping
const getActivityStyle = (type: ActivityLogEntry["type"]) => {
  switch (type) {
    case "task_completed":
      return { icon: "✅", bg: "bg-green-500/20", text: "text-green-400" };
    case "task_created":
      return { icon: "📝", bg: "bg-blue-500/20", text: "text-blue-400" };
    case "habit_logged":
      return { icon: "🎯", bg: "bg-purple-500/20", text: "text-purple-400" };
    case "focus_started":
      return { icon: "🎧", bg: "bg-indigo-500/20", text: "text-indigo-400" };
    case "focus_ended":
      return { icon: "⏱️", bg: "bg-teal-500/20", text: "text-teal-400" };
    case "badge_earned":
      return { icon: "🏆", bg: "bg-amber-500/20", text: "text-amber-400" };
    case "streak_milestone":
      return { icon: "🔥", bg: "bg-orange-500/20", text: "text-orange-400" };
    default:
      return { icon: "📌", bg: "bg-slate-500/20", text: "text-slate-400" };
  }
};

export default function ReviewScreen() {
  const { state, dispatch } = useContext(AppContext);
  const { tasks, savedItems, gamification, habits, habitLogs, activityLog } =
    state;
  const [activeTab, setActiveTab] = useState<
    "overview" | "activity" | "insights"
  >("overview");

  const score = useMemo(() => calculateProductivityScore(tasks), [tasks]);
  const weeklyData = useMemo(() => getWeeklyCompletionData(tasks), [tasks]);
  const heatmapData = useMemo(
    () => getHeatmapData(tasks, habitLogs),
    [tasks, habitLogs]
  );
  const habitStreaks = useMemo(
    () => calculateHabitStreaksFromData(habits, habitLogs),
    [habits, habitLogs]
  );

  // Calculate weekly completed tasks
  const weeklyCompletedTasks = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return tasks.filter(
      (t) => t.completed && t.completedAt && new Date(t.completedAt) >= weekAgo
    ).length;
  }, [tasks]);

  // Get best streak
  const bestStreak = useMemo(() => {
    if (habitStreaks.length === 0) return null;
    return habitStreaks.reduce(
      (best, curr) => (curr.streak > best.streak ? curr : best),
      habitStreaks[0]
    );
  }, [habitStreaks]);

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toLocaleDateString("en-CA");
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Today's tasks
    const todayTasks = tasks.filter(
      (t) =>
        t.completedAt &&
        new Date(t.completedAt).toLocaleDateString("en-CA") === today
    );
    const todayCompleted = todayTasks.filter((t) => t.completed).length;
    const todayMinutes = todayTasks.reduce(
      (sum, t) => sum + (t.actualDuration || t.duration),
      0
    );

    // Weekly tasks
    const weeklyTasks = tasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= weekAgo
    );
    const weeklyCompleted = weeklyTasks.filter((t) => t.completed).length;
    const weeklyMinutes = weeklyTasks.reduce(
      (sum, t) => sum + (t.actualDuration || t.duration),
      0
    );

    // Monthly tasks
    const monthlyTasks = tasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= monthAgo
    );
    const monthlyCompleted = monthlyTasks.filter((t) => t.completed).length;

    // Habit stats
    const todayHabits = habitLogs.filter(
      (l) => l.date === today && l.status === "done"
    ).length;
    const weeklyHabitsCompleted = habitLogs.filter((l) => {
      const logDate = new Date(l.date);
      return logDate >= weekAgo && l.status === "done";
    }).length;

    // Average daily completion rate
    const avgDailyRate =
      weeklyData.reduce((sum, d) => sum + d.rate, 0) /
      Math.max(weeklyData.length, 1);

    return {
      todayCompleted,
      todayMinutes,
      weeklyCompleted,
      weeklyMinutes,
      monthlyCompleted,
      todayHabits,
      weeklyHabitsCompleted,
      avgDailyRate,
      totalTasks: tasks.length,
      totalHabits: habits.filter((h) => !h.archived).length,
    };
  }, [tasks, habits, habitLogs, weeklyData]);

  const handleExport = () => {
    exportAllData(tasks, savedItems, gamification);
  };

  const handleAddHabit = () => {
    dispatch({ type: "SET_MODE", payload: "Habits" });
  };

  // Get today's day index
  const today = new Date().getDay();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get motivation message
  const getMotivation = () => {
    if (weeklyCompletedTasks >= 20)
      return "🏆 Outstanding! You're crushing it this week!";
    if (weeklyCompletedTasks >= 10)
      return "🔥 Great momentum! Keep the energy high!";
    if (weeklyCompletedTasks >= 5)
      return "💪 Good progress! You're building momentum!";
    if (weeklyCompletedTasks >= 1) return "🌱 Great start! Every task counts!";
    return "🚀 Ready to start your productivity journey?";
  };

  // Check if there's any data
  const hasData = tasks.length > 0 || habits.length > 0;

  // Empty state
  if (!hasData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-200 dark:border-white/10">
            <ActivityIcon className="w-10 h-10 text-slate-400 dark:text-slate-700" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100">
            No Data Yet
          </h2>
          <p className="text-slate-500 mb-8 font-medium">
            Complete tasks and build habits to see your productivity command
            center come to life!
          </p>
          <button
            onClick={() => dispatch({ type: "SET_MODE", payload: "Home" })}
            className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 transition-colors rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/20"
          >
            Start Your Journey
          </button>
        </div>
      </div>
    );
  }

  // Badge data
  const allBadgeIds = Object.keys(BADGES);
  const unlockedBadges = gamification.badges;
  const lockedBadges = allBadgeIds.filter((id) => !unlockedBadges.includes(id));

  const getBadgeHint = (badgeId: string): string => {
    switch (badgeId) {
      case "FIRST_TASK":
        return "Complete 1 task";
      case "STREAK_5":
        return "5-day streak";
      case "FOCUS_MASTER":
        return "60+ min focus";
      case "INBOX_ZERO":
        return "Clear inbox";
      default:
        return "Keep going!";
    }
  };

  return (
    <div className="space-y-4 relative pb-24">
      {/* Background Ambient Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10">
        {/* Header with Export Action */}
        <header className="flex flex-col gap-3 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                Review Dashboard
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium italic">
                "Consistency is the playground of excellence."
              </p>
            </div>
            <button
              onClick={handleExport}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleExport();
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold transition-all shadow-sm touch-manipulation"
            >
              <DownloadIcon className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
            {(["overview", "activity", "insights"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all capitalize touch-manipulation ${
                  activeTab === tab
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            {/* Today's Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Tasks Today
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-800 dark:text-white">
                  {stats.todayCompleted}
                </p>
                <p className="text-[10px] text-slate-500">
                  {stats.todayMinutes} min focused
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <FireIcon className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Habits Today
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-800 dark:text-white">
                  {stats.todayHabits}
                </p>
                <p className="text-[10px] text-slate-500">
                  of {stats.totalHabits} tracked
                </p>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl p-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ClockIcon className="w-4 h-4" /> Recent Activity
              </h3>
              {activityLog && activityLog.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {activityLog.slice(0, 30).map((entry) => {
                    const style = getActivityStyle(entry.type);
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5"
                      >
                        <div
                          className={`p-2 ${style.bg} rounded-lg text-sm shrink-0`}
                        >
                          {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                            {entry.title}
                          </p>
                          {entry.details && (
                            <p className="text-[10px] text-slate-500 truncate">
                              {entry.details}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-slate-500">
                            {formatRelativeTime(entry.timestamp)}
                          </p>
                          {entry.points && entry.points > 0 && (
                            <p className="text-[10px] font-bold text-amber-500">
                              +{entry.points} pts
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ActivityIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">
                    No activity logged yet
                  </p>
                  <p className="text-xs text-slate-400">
                    Complete tasks and habits to see your activity here
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div className="space-y-4">
            {/* Focus Heatmap */}
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <LayoutIcon className="w-4 h-4" /> Focus Heatmap
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-slate-500 uppercase font-bold">
                    Less
                  </span>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((v) => (
                      <div
                        key={v}
                        className={`w-2.5 h-2.5 rounded-sm ${
                          v === 0
                            ? "bg-slate-200 dark:bg-slate-800"
                            : v === 1
                            ? "bg-indigo-200 dark:bg-indigo-900"
                            : v === 2
                            ? "bg-indigo-300 dark:bg-indigo-700"
                            : v === 3
                            ? "bg-indigo-400 dark:bg-indigo-500"
                            : "bg-indigo-500 dark:bg-indigo-400"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[8px] text-slate-500 uppercase font-bold">
                    More
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {heatmapData.flat().map((intensity, i) => {
                  const maxVal = Math.max(...heatmapData.flat(), 1);
                  const level =
                    intensity === 0 ? 0 : Math.ceil((intensity / maxVal) * 4);
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-sm transition-all ${
                        level === 0
                          ? "bg-slate-100 dark:bg-slate-800/50"
                          : level === 1
                          ? "bg-indigo-200 dark:bg-indigo-900/60"
                          : level === 2
                          ? "bg-indigo-300 dark:bg-indigo-700/60"
                          : level === 3
                          ? "bg-indigo-400 dark:bg-indigo-500/60"
                          : "bg-indigo-500 dark:bg-indigo-400"
                      }`}
                      title={`${intensity} completed`}
                    />
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-slate-500 italic">
                Combined intensity of habits and tasks over 4 weeks
              </p>
            </div>

            {/* Monthly Summary */}
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl p-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                Monthly Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl text-center">
                  <p className="text-3xl font-black text-indigo-500">
                    {stats.monthlyCompleted}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">
                    Tasks Completed
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl text-center">
                  <p className="text-3xl font-black text-green-500">
                    {Math.round(stats.avgDailyRate)}%
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">
                    Avg. Completion
                  </p>
                </div>
              </div>
            </div>

            {/* Productivity Tips */}
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-4">
              <h3 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">
                💡 Insights
              </h3>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {stats.avgDailyRate < 50 ? (
                  <p>
                    • Try breaking large tasks into smaller chunks for better
                    completion rates
                  </p>
                ) : (
                  <p>
                    • Great completion rate! Consider increasing your daily task
                    load
                  </p>
                )}
                {bestStreak && bestStreak.streak >= 7 ? (
                  <p>• Amazing streak! You're building powerful habits 🔥</p>
                ) : (
                  <p>
                    • Focus on maintaining streaks - consistency beats intensity
                  </p>
                )}
                {stats.todayCompleted === 0 ? (
                  <p>• Start your day with one small win to build momentum</p>
                ) : (
                  <p>• You're making progress today! Keep the momentum going</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab (original content wrapped) */}
        {activeTab === "overview" && (
          <>
            {/* 1. Weekly Summary Card */}
            <section className="mb-4">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl md:rounded-[2rem] p-4 md:p-8 shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-1.5 md:p-2 bg-white/20 rounded-lg md:rounded-xl backdrop-blur-md">
                        <TrophyIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-indigo-100">
                        Weekly Achievement
                      </span>
                    </div>
                    <h2 className="text-lg md:text-3xl font-black text-white leading-tight">
                      {getMotivation()}
                    </h2>
                    <div className="flex flex-wrap gap-2 md:gap-3 pt-1">
                      <div className="bg-black/20 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-white/10">
                        <p className="text-[8px] md:text-[10px] uppercase font-bold text-indigo-200 tracking-tight">
                          Tasks Completed
                        </p>
                        <p className="text-lg md:text-xl font-black">
                          {weeklyCompletedTasks}
                        </p>
                      </div>
                      {bestStreak && bestStreak.streak > 0 && (
                        <div className="bg-black/20 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-white/10">
                          <p className="text-[8px] md:text-[10px] uppercase font-bold text-indigo-200 tracking-tight">
                            Best Streak
                          </p>
                          <p className="text-lg md:text-xl font-black flex items-center gap-1 md:gap-2">
                            <FireIcon className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />{" "}
                            {bestStreak.streak}d
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-32 md:w-64 h-32 md:h-64 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              {/* Stats Cards - Show first on mobile */}
              <div className="lg:col-span-4 lg:order-2 space-y-4">
                {/* Stat Cards */}
                <div className="grid grid-cols-3 gap-2 md:grid-cols-1 md:gap-4">
                  {/* Productivity Score */}
                  <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-3 md:p-5 rounded-2xl md:rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all group shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                      <div className="p-2 md:p-3 bg-indigo-100 dark:bg-white/5 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform duration-300 w-fit">
                        <TargetIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Score
                        </p>
                        <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-white">
                          {score}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Total Points */}
                  <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-3 md:p-5 rounded-2xl md:rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all group shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                      <div className="p-2 md:p-3 bg-amber-100 dark:bg-white/5 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform duration-300 w-fit">
                        <SparklesIcon className="w-4 h-4 md:w-5 md:h-5 text-amber-500 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Points
                        </p>
                        <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-white">
                          {gamification.points.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Badges Earned */}
                  <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-3 md:p-5 rounded-2xl md:rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all group shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                      <div className="p-2 md:p-3 bg-emerald-100 dark:bg-white/5 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform duration-300 w-fit">
                        <MedalIcon className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Badges
                        </p>
                        <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-white">
                          {gamification.badges.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Habit Streaks Section */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-lg">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                    Habit Streaks
                  </h3>
                  <div className="space-y-2 md:space-y-3">
                    {habitStreaks.length > 0 ? (
                      habitStreaks.slice(0, 3).map((habit, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 group hover:border-slate-300 dark:hover:border-white/10 transition-all"
                        >
                          <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 truncate mr-2">
                            {habit.name}
                          </span>
                          <div className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-orange-500/10 border border-orange-500/20 shadow-inner flex-shrink-0">
                            <FireIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-orange-500" />
                            <span className="text-[10px] md:text-xs font-black text-orange-500 dark:text-orange-400">
                              {habit.streak}d
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-3">
                        No streaks yet
                      </p>
                    )}
                    <button
                      onClick={handleAddHabit}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handleAddHabit();
                      }}
                      className="w-full mt-2 p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-dashed border-slate-700 hover:border-indigo-500/50 active:bg-indigo-500/10 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest touch-manipulation"
                    >
                      <PlusIcon className="w-3.5 h-3.5" /> Add Habit
                    </button>
                  </div>
                </div>

                {/* Badges Display */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-lg">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                    Achievements
                  </h3>
                  <div className="grid grid-cols-4 md:grid-cols-2 gap-2 md:gap-3">
                    {unlockedBadges.slice(0, 4).map((badgeId) => {
                      const badge = BADGES[badgeId];
                      if (!badge) return null;
                      return (
                        <div
                          key={badgeId}
                          className="relative p-2 md:p-4 rounded-xl md:rounded-2xl border text-center bg-indigo-50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20 shadow-md"
                        >
                          <div className="text-xl md:text-3xl mb-1">
                            {badge.icon}
                          </div>
                          <p className="text-[8px] md:text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">
                            {badge.name}
                          </p>
                        </div>
                      );
                    })}
                    {lockedBadges
                      .slice(0, 4 - Math.min(unlockedBadges.length, 4))
                      .map((badgeId) => {
                        const badge = BADGES[badgeId];
                        if (!badge) return null;
                        return (
                          <div
                            key={badgeId}
                            className="relative p-2 md:p-4 rounded-xl md:rounded-2xl border text-center bg-slate-900/40 border-white/5 grayscale opacity-50"
                          >
                            <div className="text-xl md:text-3xl mb-1">🔒</div>
                            <p className="text-[8px] md:text-[10px] font-black text-slate-200 uppercase truncate">
                              {badge.name}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                  {allBadgeIds.length > 4 && (
                    <button className="w-full mt-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors flex items-center justify-center gap-2 touch-manipulation">
                      All Achievements{" "}
                      <ChevronRightIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Left Column (Charts & Heatmap) */}
              <div className="lg:col-span-8 lg:order-1 space-y-4 md:space-y-6">
                {/* Weekly Completion Chart */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl md:rounded-[2rem] p-4 md:p-6 backdrop-blur-xl shadow-xl">
                  <h3 className="text-sm md:text-lg font-bold mb-4 md:mb-6 flex items-center gap-2 md:gap-3 text-slate-800 dark:text-slate-100">
                    <TrendingUpIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 dark:text-indigo-400" />{" "}
                    Weekly Completion
                  </h3>
                  <div className="flex items-end justify-between h-28 md:h-40 gap-1 md:gap-2">
                    {weeklyData.map((d, i) => {
                      const isToday = dayNames[today] === d.day;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-2 md:gap-3 group"
                        >
                          <div className="relative w-full flex justify-center h-20 md:h-32">
                            <div
                              className={`w-full max-w-[28px] md:max-w-[40px] rounded-t-lg md:rounded-t-xl transition-all duration-700 ease-out ${
                                isToday
                                  ? "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                                  : "bg-slate-200 dark:bg-slate-800 group-hover:bg-slate-300 dark:group-hover:bg-slate-700"
                              }`}
                              style={{ height: `${Math.max(d.rate, 5)}%` }}
                            >
                              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {d.rate.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${
                              isToday
                                ? "text-indigo-500 dark:text-indigo-400"
                                : "text-slate-500"
                            }`}
                          >
                            {d.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Focus Heatmap */}
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl md:rounded-[2rem] p-4 md:p-6 backdrop-blur-xl">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-4 md:mb-6">
                    <h3 className="text-sm md:text-lg font-bold flex items-center gap-2 md:gap-3 text-slate-800 dark:text-slate-100">
                      <LayoutIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 dark:text-indigo-400" />{" "}
                      Focus Heatmap
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] md:text-[10px] text-slate-500 uppercase font-black">
                        Less
                      </span>
                      <div className="flex gap-0.5 md:gap-1">
                        {[0, 1, 2, 3, 4].map((v) => (
                          <div
                            key={v}
                            className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm ${
                              v === 0
                                ? "bg-slate-800"
                                : v === 1
                                ? "bg-indigo-900"
                                : v === 2
                                ? "bg-indigo-700"
                                : v === 3
                                ? "bg-indigo-500"
                                : "bg-indigo-400"
                            }`}
                          ></div>
                        ))}
                      </div>
                      <span className="text-[8px] md:text-[10px] text-slate-500 uppercase font-black">
                        More
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {heatmapData.flat().map((intensity, i) => {
                      const maxVal = Math.max(...heatmapData.flat(), 1);
                      const level =
                        intensity === 0
                          ? 0
                          : Math.ceil((intensity / maxVal) * 4);
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-sm md:rounded-md transition-all duration-300 ${
                            level === 0
                              ? "bg-slate-800/50"
                              : level === 1
                              ? "bg-indigo-900/60"
                              : level === 2
                              ? "bg-indigo-700/60"
                              : level === 3
                              ? "bg-indigo-500/60"
                              : "bg-indigo-400"
                          }`}
                          title={`${intensity} item${
                            intensity !== 1 ? "s" : ""
                          } completed`}
                        ></div>
                      );
                    })}
                  </div>
                  <p className="mt-3 md:mt-4 text-[8px] md:text-[10px] text-slate-500 font-medium italic">
                    Combined intensity of habits and tasks over the last 4
                    weeks.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
