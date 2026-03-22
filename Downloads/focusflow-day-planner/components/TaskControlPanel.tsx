import React, { useContext } from "react";
import { Task, MatrixQuadrant } from "../types.ts";
import { AppContext } from "../context/AppContext.tsx";
import { XMarkIcon } from "./icons.tsx";

export default function TaskControlPanel({ task }: { task: Task }) {
  const { dispatch } = useContext(AppContext);

  const handleClose = () => {
    dispatch({ type: "SET_CONTROL_PANEL_TASK", payload: null });
  };

  const handleStartFocus = () => {
    dispatch({ type: "START_FOCUS", payload: task });
  };

  const handleEdit = () => {
    dispatch({ type: "SET_EDITING_TASK", payload: task });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      dispatch({ type: "DELETE_TASK", payload: task.id });
      handleClose();
    }
  };

  const handleComplete = () => {
    dispatch({
      type: "COMPLETE_TASK",
      payload: { taskId: task.id, completedAt: new Date().toISOString() },
    });
    handleClose();
  };

  const handleSnooze = () => {
    // Move task to tomorrow at the same time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const snoozedTask = {
      ...task,
      snoozedTo: tomorrow.toLocaleDateString("en-CA"), // Timezone-safe
    };
    dispatch({ type: "UPDATE_TASK", payload: snoozedTask });
    handleClose();
    alert(`"${task.title}" snoozed to tomorrow!`);
  };

  const handleSetQuadrant = (quadrant: MatrixQuadrant) => {
    dispatch({
      type: "UPDATE_TASK",
      payload: { ...task, matrixQuadrant: quadrant },
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 modal-backdrop"
      onClick={handleClose}
    >
      <div
        className="bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm modal-content overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                {task.title}
              </h2>
              <p className="text-sm text-slate-400">
                {task.duration} min &bull; {task.startTime}
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
            onClick={handleComplete}
            disabled={task.completed}
            className="w-full text-left p-3 rounded-xl font-medium text-green-400 hover:bg-green-900/30 disabled:text-slate-500 disabled:bg-transparent disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>✓</span> Quick Complete
          </button>
          <button
            onClick={handleStartFocus}
            disabled={task.completed}
            className="w-full text-left p-3 rounded-xl font-medium text-slate-200 hover:bg-slate-800/80 disabled:text-slate-500 disabled:bg-transparent disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>⏱️</span> Start Focus Timer (optional)
          </button>
          <button
            onClick={handleEdit}
            className="w-full text-left p-3 rounded-xl font-medium text-slate-200 hover:bg-slate-800/80 flex items-center gap-2"
          >
            <span>✏️</span> Edit Task
          </button>
          <button
            onClick={handleSnooze}
            disabled={task.completed}
            className="w-full text-left p-3 rounded-xl font-medium text-amber-400 hover:bg-amber-900/30 disabled:text-slate-500 disabled:bg-transparent disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>⏰</span> Snooze to Tomorrow
          </button>
          <div className="p-3">
            <label
              htmlFor="matrix-quadrant"
              className="text-sm font-medium text-slate-400"
            >
              Prioritize:
            </label>
            <select
              id="matrix-quadrant"
              value={task.matrixQuadrant || "schedule"}
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
            onClick={handleDelete}
            className="w-full text-left p-3 rounded-xl font-medium text-red-400 hover:bg-red-900/30 flex items-center gap-2"
          >
            <span>🗑️</span> Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}
