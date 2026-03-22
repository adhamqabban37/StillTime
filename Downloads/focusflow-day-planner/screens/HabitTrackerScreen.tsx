import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext.tsx";
import { HabitWithStats, HabitLogStatus, Habit } from "../types.ts";
import {
  enrichHabitWithStats,
  getToday,
  isHabitExpectedOnDate,
} from "../logic/habitUtils.ts";
import { PlusIcon, SparklesIcon, FireIcon } from "../components/icons.tsx";
import HabitCheckItem from "../components/HabitCheckItem.tsx";
import HabitDetailModal from "../components/HabitDetailModal.tsx";
import AddHabitForm from "../components/AddHabitForm.tsx";
import WeeklyRecapModal from "../components/WeeklyRecapModal.tsx";

const HabitTrackerScreen: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const [selectedHabit, setSelectedHabit] = useState<HabitWithStats | null>(
    null
  );
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<"today" | "all">("today");

  const today = getToday();

  // Get all active habits with stats
  const activeHabits = state.habits
    .filter((h) => !h.archived)
    .map((h) => enrichHabitWithStats(h, state.habitLogs));

  // Filter for today's habits (expected today)
  const todaysHabits = activeHabits.filter((h) => h.isExpectedToday);

  // Sort: incomplete first
  const sortedTodaysHabits = [...todaysHabits].sort((a, b) => {
    if (a.todayStatus === "done" && b.todayStatus !== "done") return 1;
    if (a.todayStatus !== "done" && b.todayStatus === "done") return -1;
    return 0;
  });

  // All habits sorted by completion rate
  const allHabits = [...activeHabits].sort(
    (a, b) => b.completionRate - a.completionRate
  );

  // Calculate overall stats
  const completedToday = todaysHabits.filter(
    (h) => h.todayStatus === "done"
  ).length;
  const totalToday = todaysHabits.length;
  const completionPercentage =
    totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Get longest streak across all habits
  const longestCurrentStreak = activeHabits.reduce(
    (max, h) => Math.max(max, h.currentStreak),
    0
  );

  const handleToggle = (habitId: string, status: HabitLogStatus) => {
    // If unchecking (status is "missed"), remove the log entirely instead of marking as missed
    if (status === "missed") {
      dispatch({
        type: "REMOVE_HABIT_LOG",
        payload: {
          habitId,
          date: today,
        },
      });
    } else {
      dispatch({
        type: "LOG_HABIT",
        payload: {
          habitId,
          date: today,
          status,
        },
      });
    }

    // Show toast and potentially confetti for completing
    if (status === "done") {
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: "Habit completed! 🎉" },
      });
      dispatch({ type: "ADD_POINTS", payload: 15 });

      // Check if all habits for today are done
      const willAllBeDone = todaysHabits
        .filter((h) => h.id !== habitId)
        .every((h) => h.todayStatus === "done");
      if (willAllBeDone && todaysHabits.length > 1) {
        dispatch({ type: "SHOW_CONFETTI" });
        dispatch({
          type: "SHOW_TOAST",
          payload: { message: "All habits done for today! 🏆" },
        });
      }
    }
  };

  const handleHabitPress = (habit: HabitWithStats) => {
    setSelectedHabit(habit);
  };

  const handleEdit = () => {
    if (selectedHabit) {
      setEditingHabit(selectedHabit);
      setSelectedHabit(null);
    }
  };

  const displayedHabits = viewMode === "today" ? sortedTodaysHabits : allHabits;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700/50">
        <div className="px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Habits
            </h1>
            <button
              onClick={() => setShowAddForm(true)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setShowAddForm(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-4 py-2 rounded-xl text-white font-medium transition-colors touch-manipulation"
            >
              <PlusIcon className="w-5 h-5" />
              Add
            </button>
          </div>

          {/* Stats Bar */}
          {activeHabits.length > 0 && (
            <div className="flex gap-3">
              <div className="flex-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
                <SparklesIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                <div>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">
                    {completedToday}/{totalToday}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Today
                  </p>
                </div>
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ml-2">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {longestCurrentStreak > 0 && (
                <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl p-3 flex items-center gap-2 border border-orange-500/30">
                  <FireIcon className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                  <div>
                    <p className="text-xl font-bold text-orange-500 dark:text-orange-400">
                      {longestCurrentStreak}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Best
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View Toggle */}
          {activeHabits.length > 0 && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setViewMode("today")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  viewMode === "today"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50"
                }`}
              >
                Today ({todaysHabits.length})
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  viewMode === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50"
                }`}
              >
                All ({activeHabits.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {displayedHabits.length === 0 ? (
          <div className="text-center py-16">
            {activeHabits.length === 0 ? (
              <>
                <div className="text-6xl mb-4">🌱</div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                  Start building habits
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                  Track your daily routines and build lasting habits with
                  streaks and history.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl text-white font-medium transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Your First Habit
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">😴</div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                  Rest day today!
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  No habits scheduled for today. Enjoy your break!
                </p>
              </>
            )}
          </div>
        ) : (
          displayedHabits.map((habit) => (
            <HabitCheckItem
              key={habit.id}
              habit={habit}
              onToggle={handleToggle}
              onPress={handleHabitPress}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {selectedHabit && (
        <HabitDetailModal
          habit={selectedHabit}
          logs={state.habitLogs}
          onClose={() => setSelectedHabit(null)}
          onEdit={handleEdit}
        />
      )}

      {(showAddForm || editingHabit) && (
        <AddHabitForm
          editingHabit={editingHabit}
          onClose={() => {
            setShowAddForm(false);
            setEditingHabit(null);
          }}
        />
      )}

      {state.showWeeklyRecap && state.weeklyRecap && (
        <WeeklyRecapModal
          recap={state.weeklyRecap}
          onClose={() => dispatch({ type: "HIDE_WEEKLY_RECAP" })}
        />
      )}
    </div>
  );
};

export default HabitTrackerScreen;
