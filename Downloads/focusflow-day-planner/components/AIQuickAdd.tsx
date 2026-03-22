import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext.tsx";
import { useGemini } from "../hooks/useGemini.ts";
import { SparklesIcon } from "./icons.tsx";

export default function AIQuickAdd() {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { dispatch } = useContext(AppContext);
  const { parseNaturalLanguageTask, estimateTaskDuration } = useGemini();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      const parsed = await parseNaturalLanguageTask(input);

      if (parsed) {
        const newTask = {
          id: Date.now().toString(),
          title: parsed.title,
          duration: parsed.duration,
          type: parsed.type,
          startTime: parsed.suggestedTime || "09:00",
          recurrence: parsed.type === "Habit" ? "daily" : "none",
          completed: false,
          matrixQuadrant: parsed.matrixQuadrant,
          aiGenerated: true,
        };

        dispatch({ type: "ADD_TASK", payload: newTask as any });
        dispatch({
          type: "SHOW_TOAST",
          payload: { message: `✨ Added: ${parsed.title}`, icon: "✨" },
        });
        setInput("");
      } else {
        dispatch({
          type: "SHOW_TOAST",
          payload: {
            message: "Could not parse task. Try being more specific.",
            icon: "⚠️",
          },
        });
      }
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-2 bg-slate-900/40 rounded-2xl shadow-lg border border-white/5 p-2">
        <SparklesIcon className="w-5 h-5 text-indigo-400 ml-2" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type naturally: 'Call mom for 15 mins at 2pm'..."
          className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 text-sm"
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isProcessing
              ? "bg-slate-700 text-slate-400 cursor-wait"
              : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
          }`}
        >
          {isProcessing ? "..." : "Add"}
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-1 ml-2">
        AI will parse time, duration, and priority automatically
      </p>
    </form>
  );
}
