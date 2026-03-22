import React, { useContext, useState, useEffect, useMemo } from "react";
import { AppContext } from "../context/AppContext.tsx";
import { Task, MoodLevel, DailySummary, HabitLogStatus } from "../types.ts";
import { parseAndCreateSavedItem } from "../logic/shareHandler.ts";
import { requestNotificationPermission } from "../logic/notifications.ts";
import { useNextAction } from "../hooks/useNextAction.ts";
import { useGemini } from "../hooks/useGemini.ts";
import { SparklesIcon, FireIcon, XMarkIcon } from "../components/icons.tsx";
import DailySummaryCard from "../components/DailySummaryCard.tsx";
import { enrichHabitWithStats, getToday } from "../logic/habitUtils.ts";
import { getStreakData } from "../logic/streakTracker.ts";

// Icons as inline SVGs for the new design
const ZapIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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

const BellIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
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

const QuoteIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
  </svg>
);

const LinkIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
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

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const MoreVerticalIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

export default function HomeScreen() {
  const { state, dispatch } = useContext(AppContext);
  const { activeTask, tasks, habits, habitLogs, gamification } = state;
  const {
    getMoodBasedSuggestion,
    generateDailySummary,
    isLoading,
    error: geminiError,
  } = useGemini();
  useNextAction();

  const [currentMood, setCurrentMood] = useState<number | null>(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(
    state.notificationPermission !== "granted"
  );
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [quickSaveUrl, setQuickSaveUrl] = useState("");
  const [aiInput, setAiInput] = useState("");

  const suggestion = state.nextActionSuggestion;
  const today = getToday();

  // Get today's habits with stats
  const todaysHabits = useMemo(() => {
    return habits
      .filter((h) => !h.archived)
      .map((h) => enrichHabitWithStats(h, habitLogs))
      .filter((h) => {
        if (h.frequencyType === "daily") return true;
        if (h.frequencyType === "custom" && h.daysOfWeek) {
          return h.daysOfWeek.includes(new Date().getDay());
        }
        if (h.frequencyType === "weekly") return true;
        return h.isExpectedToday;
      });
  }, [habits, habitLogs]);

  const completedHabitsCount = todaysHabits.filter(
    (h) => h.todayStatus === "done"
  ).length;
  const habitProgress =
    todaysHabits.length > 0
      ? Math.round((completedHabitsCount / todaysHabits.length) * 100)
      : 0;

  const moods = [
    { icon: "😔", label: "Low" },
    { icon: "😐", label: "Neutral" },
    { icon: "😊", label: "Good" },
    { icon: "🔥", label: "Energetic" },
    { icon: "🧘", label: "Calm" },
  ];

  const handleToggleHabit = (habitId: string) => {
    const habit = todaysHabits.find((h) => h.id === habitId);
    if (!habit) return;

    if (habit.todayStatus === "done") {
      dispatch({ type: "REMOVE_HABIT_LOG", payload: { habitId, date: today } });
    } else {
      dispatch({
        type: "LOG_HABIT",
        payload: { habitId, date: today, status: "done" as HabitLogStatus },
      });
      dispatch({ type: "ADD_POINTS", payload: 15 });
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: "Habit completed! 🎉" },
      });
    }
  };

  const handleMoodSelect = async (moodIndex: number) => {
    setCurrentMood(moodIndex);
    const moodLevels: MoodLevel[] = [
      "stressed",
      "tired",
      "neutral",
      "focused",
      "energized",
    ];
    const result = await getMoodBasedSuggestion(tasks, moodLevels[moodIndex]);
    if (result) {
      dispatch({
        type: "SET_NEXT_ACTION_SUGGESTION",
        payload: {
          task: result.task,
          reason: result.reason,
          suggestionType: "deep_work",
          moodAdjusted: true,
        },
      });
    }
  };

  const handleStartFocus = () => {
    if (suggestion) {
      dispatch({ type: "START_FOCUS", payload: suggestion.task });
      dispatch({ type: "SET_NEXT_ACTION_SUGGESTION", payload: null });
    }
  };

  const handleDismissSuggestion = () => {
    dispatch({ type: "SET_NEXT_ACTION_SUGGESTION", payload: null });
  };

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission();
    dispatch({ type: "SET_NOTIFICATION_PERMISSION", payload: permission });
    if (permission === "granted") {
      setShowNotificationBanner(false);
    }
  };

  const handleQuickSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSaveUrl.trim()) return;
    try {
      const newItem = parseAndCreateSavedItem(quickSaveUrl);
      dispatch({ type: "ADD_SAVED_ITEM", payload: newItem });
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: `"${newItem.title}" saved!` },
      });
      setQuickSaveUrl("");
    } catch {
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: "Invalid URL" },
      });
    }
  };

  const handleGenerateSummary = async () => {
    const summary = await generateDailySummary(tasks, today);
    if (summary) {
      setDailySummary(summary);
      setShowSummary(true);
    }
  };

  // Daily quote
  const quotes = [
    {
      text: "The secret of getting ahead is getting started.",
      author: "Mark Twain",
    },
    {
      text: "Focus on being productive instead of busy.",
      author: "Tim Ferriss",
    },
    {
      text: "Small daily improvements are the key to staggering long-term results.",
      author: "Robin Sharma",
    },
    {
      text: "The way to get started is to quit talking and begin doing.",
      author: "Walt Disney",
    },
    {
      text: "Don't watch the clock; do what it does. Keep going.",
      author: "Sam Levenson",
    },
  ];
  const dailyQuote = quotes[new Date().getDate() % quotes.length];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-slate-800 dark:text-slate-100 -m-4 p-4 md:p-8 pb-32">
      {/* CSS for gradient animation */}
      <style>{`
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 5s ease infinite;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>

      {/* Notification Setup Banner */}
      {showNotificationBanner && (
        <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <BellIcon className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-amber-200 font-medium tracking-tight">
              Enable notifications to stay on track with your habits.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleEnableNotifications}
              className="text-xs font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400"
            >
              Enable
            </button>
            <button
              onClick={() => setShowNotificationBanner(false)}
              className="text-slate-500 hover:text-white"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-slate-400 mt-1">What will you accomplish today?</p>

          {/* Daily Quote */}
          <div className="mt-4 flex items-center gap-2 text-slate-500 italic text-sm">
            <QuoteIcon className="w-3 h-3 text-indigo-400/50" />
            <span>
              "{dailyQuote.text}" — {dailyQuote.author}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          {/* Next Action Card */}
          {suggestion && !activeTask && (
            <div className="relative group p-[1px] rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-60 group-hover:opacity-100 animate-gradient-xy transition-opacity"></div>
              <div className="relative bg-[#111114] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <ZapIcon className="w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                      Next Best Action
                    </span>
                    {suggestion.moodAdjusted && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-[10px] text-indigo-300 border border-indigo-500/20">
                        Mood Adjusted
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {suggestion.task.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {suggestion.reason}
                  </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={handleStartFocus}
                    className="flex-1 md:flex-none px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    Start Now <ArrowRightIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDismissSuggestion}
                    className="px-4 py-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-all text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Today's Habits */}
          <section className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
            {/* Celebration Banner */}
            {habitProgress === 100 && todaysHabits.length > 0 && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 animate-bounce-subtle">
                <div className="p-2 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20">
                  <TrophyIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-emerald-400 font-bold">
                    Incredible! All habits complete.
                  </p>
                  <p className="text-xs text-emerald-400/60 font-medium">
                    You dominated today's routine.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-400" />{" "}
                  Today's Habits
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {completedHabitsCount} of {todaysHabits.length} complete
                </p>
              </div>
              <button
                onClick={() =>
                  dispatch({ type: "SET_MODE", payload: "Habits" })
                }
                className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                Manage
              </button>
            </div>

            {todaysHabits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No habits yet.</p>
                <button
                  onClick={() =>
                    dispatch({ type: "SET_MODE", payload: "Habits" })
                  }
                  className="mt-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-500 hover:text-white transition-all"
                >
                  Add Your First Habit
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todaysHabits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => handleToggleHabit(habit.id)}
                    className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      habit.todayStatus === "done"
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-slate-800/30 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          habit.todayStatus === "done"
                            ? "bg-emerald-500 border-emerald-400"
                            : "border-slate-600 group-hover:border-slate-400"
                        }`}
                      >
                        {habit.todayStatus === "done" && (
                          <CheckCircleIcon className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            habit.todayStatus === "done"
                              ? "text-slate-200"
                              : "text-slate-300"
                          }`}
                        >
                          {habit.icon} {habit.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-orange-400 font-bold flex items-center gap-0.5">
                            <FireIcon className="w-3 h-3" />{" "}
                            {habit.currentStreak}
                          </span>
                        </div>
                      </div>
                    </div>
                    <MoreVerticalIcon className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Current Task vs No Task Card */}
          <section className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-3xl p-6">
            {activeTask ? (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">
                      Active Task: {activeTask.title}
                    </h4>
                    <p className="text-sm text-indigo-400 font-mono tracking-wider">
                      In Progress
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      dispatch({ type: "START_FOCUS", payload: activeTask })
                    }
                    className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-700"
                  >
                    Resume Focus
                  </button>
                  <button
                    onClick={() =>
                      dispatch({
                        type: "COMPLETE_TASK",
                        payload: {
                          taskId: activeTask.id,
                          completedAt: new Date().toISOString(),
                        },
                      })
                    }
                    className="px-4 py-2 bg-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-500"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-2xl mb-2">🌴</p>
                <h4 className="text-xl font-bold text-slate-200">
                  You're free!
                </h4>
                <p className="text-slate-500 text-sm mb-4">
                  No tasks scheduled for right now.
                </p>
                <button
                  onClick={() =>
                    dispatch({ type: "SET_MODE", payload: "Timeline" })
                  }
                  className="px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-500 hover:text-white transition-all"
                >
                  Plan Your Day
                </button>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          {/* Streak Counter & Progress Bar */}
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/5 backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">
                    Productivity
                  </h3>
                  <p className="text-2xl font-black">
                    Day {getStreakData().currentStreak || 1}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <FireIcon className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold text-orange-400">
                      Streak Active
                    </span>
                  </div>
                </div>
                <ActivityIcon className="w-8 h-8 text-indigo-400/30" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Daily Progress</span>
                  <span>{habitProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                    style={{
                      width: `${habitProgress}%`,
                      boxShadow: "0 0 10px rgba(99,102,241,0.5)",
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
          </div>

          {/* Mood Selector */}
          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-lg">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
              Current Vibe
            </h3>
            <div className="flex justify-between items-center bg-black/30 p-2 rounded-2xl">
              {moods.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMoodSelect(idx)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    currentMood === idx
                      ? "bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/40"
                      : "hover:bg-white/5 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-[10px] font-bold">{m.label}</span>
                </button>
              ))}
            </div>
            {currentMood !== null && (
              <p className="text-[10px] text-indigo-400 mt-4 text-center font-medium animate-pulse">
                AI is adjusting suggestions for your mood...
              </p>
            )}
          </div>

          {/* AI Daily Summary */}
          {showSummary && dailySummary ? (
            <DailySummaryCard
              summary={dailySummary}
              onDismiss={() => setShowSummary(false)}
            />
          ) : (
            <button
              onClick={handleGenerateSummary}
              disabled={isLoading}
              className="w-full p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between group hover:bg-indigo-500/20 transition-all shadow-lg disabled:opacity-50"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <SparklesIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-200">
                    {isLoading ? "Generating..." : "Generate Summary"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Insights for your day
                  </p>
                </div>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* Quick Save Input */}
          <div className="bg-white/80 dark:bg-slate-800/20 border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-lg">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <LinkIcon className="w-3 h-3" /> Inbox Capture
            </h3>
            <form onSubmit={handleQuickSave} className="relative flex gap-2">
              <input
                type="text"
                value={quickSaveUrl}
                onChange={(e) => setQuickSaveUrl(e.target.value)}
                placeholder="Paste URL to save..."
                className="bg-black/40 border-none outline-none flex-1 text-xs text-slate-300 placeholder:text-slate-600 px-4 py-3 rounded-xl focus:ring-1 focus:ring-indigo-500/50"
              />
              <button
                type="submit"
                className="bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold px-4 py-2 rounded-xl transition-all"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* AI Quick Add Command Bar */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-50">
        <div className="relative group">
          <div className="absolute inset-0 bg-indigo-500/30 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
          <div className="relative bg-[#1a1a1e]/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/40">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask AI to log or schedule anything..."
              className="bg-transparent border-none outline-none flex-1 text-sm text-slate-200 placeholder:text-slate-500 py-2"
            />
            <div className="flex items-center gap-2 pr-2">
              <kbd className="hidden md:flex px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-500 font-sans tracking-tighter italic">
                AI Search
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
