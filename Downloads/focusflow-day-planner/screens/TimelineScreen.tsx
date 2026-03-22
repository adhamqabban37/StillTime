import React, { useContext } from "react";
import Timeline from "../components/Timeline.tsx";
import { AppContext } from "../context/AppContext.tsx";
import { PlusIcon } from "../components/icons.tsx";

export default function TimelineScreen() {
  const { dispatch } = useContext(AppContext);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-200">
          Today's Schedule
        </h2>
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
      <Timeline />
    </div>
  );
}
