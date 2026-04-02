import React, { useContext, useCallback } from "react";
import Timeline from "../components/Timeline.tsx";
import { AppContext } from "../context/AppContext.tsx";
import { PlusIcon } from "../components/icons.tsx";
import { generateAutopilotSchedule } from "../logic/autopilot.ts";

export default function TimelineScreen() {
  const { state, dispatch } = useContext(AppContext);

  const handleAutopilotToggle = useCallback(() => {
    const newValue = !state.autopilotEnabled;
    dispatch({ type: "SET_AUTOPILOT", payload: newValue });

    if (newValue) {
      const slots = generateAutopilotSchedule(
        state.tasks,
        state.calendarEvents,
      );
      const slotMap = new Map(slots.map((s) => [s.taskId, s]));
      const updatedTasks = state.tasks.map((task) => {
        const slot = slotMap.get(task.id);
        return slot
          ? { ...task, startTime: slot.start, duration: slot.duration }
          : task;
      });
      dispatch({ type: "SET_TASKS", payload: updatedTasks });
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: `Autopilot scheduled ${slots.length} tasks` },
      });
    }
  }, [state.autopilotEnabled, state.tasks, state.calendarEvents, dispatch]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-200">
          Today's Schedule
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutopilotToggle}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              state.autopilotEnabled
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-emerald-500/50"
            }`}
            aria-label="Toggle Autopilot Mode"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span>Autopilot</span>
          </button>
          <button
            onClick={() =>
              dispatch({
                type: "TOGGLE_ADD_TASK_FORM",
                payload: { isOpen: true },
              })
            }
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all font-medium text-sm"
            aria-label="Add new task"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>
      <Timeline />
    </div>
  );
}
