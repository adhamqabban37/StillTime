import React from "react";
import { MoodLevel } from "../types.ts";

interface MoodSelectorProps {
  currentMood: MoodLevel | null;
  onMoodSelect: (mood: MoodLevel) => void;
}

const moods: { value: MoodLevel; emoji: string; label: string }[] = [
  { value: "energized", emoji: "⚡", label: "Energized" },
  { value: "focused", emoji: "🎯", label: "Focused" },
  { value: "neutral", emoji: "😊", label: "Neutral" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "stressed", emoji: "😰", label: "Stressed" },
];

export default function MoodSelector({
  currentMood,
  onMoodSelect,
}: MoodSelectorProps) {
  return (
    <div className="bg-slate-900/40 rounded-2xl shadow-lg p-4 border border-white/5">
      <p className="text-sm font-medium text-slate-400 mb-3">
        How are you feeling?
      </p>
      <div className="flex justify-between gap-2">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => onMoodSelect(mood.value)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              currentMood === mood.value
                ? "bg-indigo-900/50 ring-2 ring-indigo-500"
                : "hover:bg-slate-800"
            }`}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className="text-xs mt-1 text-slate-400">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
