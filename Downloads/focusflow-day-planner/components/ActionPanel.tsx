import React, { useContext } from "react";
import { SavedItem, Task, MatrixQuadrant } from "../types.ts";
import { AppContext } from "../context/AppContext.tsx";
import { XMarkIcon } from "./icons.tsx";

export default function ActionPanel({ item }: { item: SavedItem }) {
  const { dispatch } = useContext(AppContext);

  const handleClose = () => {
    dispatch({ type: "SET_ACTION_PANEL_ITEM", payload: null });
  };

  const handleWatchNow = () => {
    const focusTask: Task = {
      id: `task-${item.id}`,
      title: `Watch: ${item.title}`,
      type: "Task",
      duration: item.duration || 15,
      startTime: "", // Not relevant for immediate focus
      recurrence: "none",
      completed: false,
      linkedItemId: item.id,
    };
    dispatch({ type: "START_FOCUS", payload: focusTask });
  };

  const handleSchedule = () => {
    dispatch({
      type: "TOGGLE_ADD_TASK_FORM",
      payload: {
        isOpen: true,
        defaults: {
          title: `Watch: ${item.title}`,
          duration: item.duration || 15,
          type: "Task",
          linkedItemId: item.id,
        },
      },
    });
    handleClose();
  };

  const handleMakeHabit = () => {
    dispatch({
      type: "TOGGLE_ADD_TASK_FORM",
      payload: {
        isOpen: true,
        defaults: {
          title: `Review: ${item.source} Content`,
          duration: item.duration || 15,
          type: "Habit",
          linkedItemId: item.id,
        },
      },
    });
    handleClose();
  };

  const handleDismiss = () => {
    if (window.confirm(`Are you sure you want to dismiss "${item.title}"?`)) {
      dispatch({ type: "DELETE_SAVED_ITEM", payload: item.id });
      handleClose();
    }
  };

  const handleSetQuadrant = (quadrant: MatrixQuadrant) => {
    dispatch({
      type: "UPDATE_SAVED_ITEM",
      payload: { id: item.id, matrixQuadrant: quadrant },
    });
  };

  const quadrantLabels: Record<MatrixQuadrant, string> = {
    do: "Urgent & Important",
    schedule: "Not Urgent & Important",
    delegate: "Urgent & Not Important",
    delete: "Not Urgent & Not Important",
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-end justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-slate-100 truncate">
                {item.title}
              </h2>
              <p className="text-sm text-slate-400">
                {item.source} &bull; {item.duration} min
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-100 -mt-2 -mr-2 p-2 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={handleWatchNow}
            className="w-full text-left p-3 rounded-xl font-medium text-slate-200 hover:bg-slate-800/80"
          >
            ▶ Watch Now (Focus Session)
          </button>
          <button
            onClick={handleSchedule}
            className="w-full text-left p-3 rounded-xl font-medium text-slate-200 hover:bg-slate-800/80"
          >
            📅 Schedule for Later
          </button>
          <button
            onClick={handleMakeHabit}
            className="w-full text-left p-3 rounded-xl font-medium text-slate-200 hover:bg-slate-800/80"
          >
            🔁 Make a Habit
          </button>
          <div className="p-3">
            <label
              htmlFor="matrix-quadrant-item"
              className="text-sm font-medium text-slate-400"
            >
              Prioritize:
            </label>
            <select
              id="matrix-quadrant-item"
              value={item.matrixQuadrant || "schedule"}
              onChange={(e) =>
                handleSetQuadrant(e.target.value as MatrixQuadrant)
              }
              className="mt-1 block w-full rounded-xl border-0 bg-slate-800/50 py-2 pl-3 pr-10 text-base focus:ring-2 focus:ring-indigo-500/50 sm:text-sm text-slate-100"
            >
              {(Object.keys(quadrantLabels) as MatrixQuadrant[]).map((q) => (
                <option key={q} value={q}>
                  {quadrantLabels[q]}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleDismiss}
            className="w-full text-left p-3 rounded-xl font-medium text-red-400 hover:bg-red-900/30"
          >
            ❌ Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
