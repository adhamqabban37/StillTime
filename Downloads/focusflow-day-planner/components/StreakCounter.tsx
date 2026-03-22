import React, { useEffect, useState } from "react";
import { getStreakData, checkStreakOnLoad } from "../logic/streakTracker.ts";

interface StreakCounterProps {
  refreshTrigger?: number; // Optional trigger to force refresh
}

export default function StreakCounter({ refreshTrigger }: StreakCounterProps) {
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    const data = checkStreakOnLoad();
    setStreak(data.currentStreak);
    setLongestStreak(data.longestStreak);
  }, [refreshTrigger]);

  // Get streak message and emoji
  const getStreakDisplay = () => {
    if (streak === 0) {
      return { emoji: "🌱", message: "Start your streak today!" };
    }
    if (streak === 1) {
      return { emoji: "🔥", message: "1 day streak!" };
    }
    if (streak < 7) {
      return { emoji: "🔥", message: `${streak} day streak!` };
    }
    if (streak < 30) {
      return { emoji: "⚡", message: `${streak} day streak!` };
    }
    if (streak < 100) {
      return { emoji: "🚀", message: `${streak} day streak!` };
    }
    return { emoji: "👑", message: `${streak} day streak!` };
  };

  const { emoji, message } = getStreakDisplay();

  return (
    <div className="bg-gradient-to-r from-orange-900/30 to-amber-900/30 rounded-2xl p-4 border border-orange-800/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <p className="text-lg font-bold text-orange-300">{message}</p>
            {longestStreak > streak && longestStreak > 0 && (
              <p className="text-xs text-orange-400/70">
                Best: {longestStreak} days
              </p>
            )}
          </div>
        </div>
        {streak >= 7 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-400">{streak}</p>
            <p className="text-xs text-orange-500">days</p>
          </div>
        )}
      </div>
    </div>
  );
}
