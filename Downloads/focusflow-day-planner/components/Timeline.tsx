import React, { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext.tsx";
import { DAY_START_HOUR, DAY_END_HOUR, MINUTE_HEIGHT } from "../constants.ts";
import TaskCard from "./TaskCard.tsx";
import { Task } from "../types.ts";

// Calculate column positions for overlapping tasks
function calculateTaskColumns(
  tasks: Task[]
): Map<string, { column: number; totalColumns: number }> {
  const result = new Map<string, { column: number; totalColumns: number }>();

  // Filter and sort tasks by start time
  const scheduledTasks = tasks
    .filter((t) => t.startTime && t.duration)
    .map((t) => {
      const [h, m] = (t.startTime || "09:00").split(":").map(Number);
      const startMin = h * 60 + m;
      const endMin = startMin + (t.duration || 30);
      return { ...t, startMin, endMin };
    })
    .sort((a, b) => a.startMin - b.startMin);

  // Find overlapping groups
  const groups: (typeof scheduledTasks)[] = [];

  for (const task of scheduledTasks) {
    // Find a group this task overlaps with
    let foundGroup = false;
    for (const group of groups) {
      const overlapsGroup = group.some(
        (g) => task.startMin < g.endMin && task.endMin > g.startMin
      );
      if (overlapsGroup) {
        group.push(task);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      groups.push([task]);
    }
  }

  // Assign columns within each group
  for (const group of groups) {
    // Sort by start time, then by duration (shorter first for better layout)
    group.sort(
      (a, b) =>
        a.startMin - b.startMin ||
        a.endMin - a.startMin - (b.endMin - b.startMin)
    );

    const columns: (typeof scheduledTasks)[] = [];

    for (const task of group) {
      // Find first column where this task doesn't overlap
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1];
        if (task.startMin >= lastInCol.endMin) {
          columns[col].push(task);
          result.set(task.id, { column: col, totalColumns: 0 });
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([task]);
        result.set(task.id, { column: columns.length - 1, totalColumns: 0 });
      }
    }

    // Update total columns for all tasks in this group
    const totalCols = columns.length;
    for (const task of group) {
      const existing = result.get(task.id);
      if (existing) {
        result.set(task.id, { ...existing, totalColumns: totalCols });
      }
    }
  }

  return result;
}

export default function Timeline() {
  const { state } = useContext(AppContext);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    slots.push(`${DAY_END_HOUR.toString().padStart(2, "0")}:00`);
    return slots;
  }, []);

  const totalHeight = (DAY_END_HOUR - DAY_START_HOUR) * 60 * MINUTE_HEIGHT;

  // Calculate column layout for overlapping tasks
  const taskColumns = useMemo(
    () => calculateTaskColumns(state.tasks),
    [state.tasks]
  );

  const scheduledTasks = state.tasks.filter(
    (task) => task.startTime && task.duration
  );

  return (
    <div className="relative" style={{ height: `${totalHeight}px` }}>
      {/* Time Slot Markers */}
      <div className="absolute inset-y-0 left-0 w-20 pr-4 text-right">
        {timeSlots.map((time, index) => {
          const [hour, minute] = time.split(":").map(Number);
          const topPosition =
            ((hour - DAY_START_HOUR) * 60 + minute) * MINUTE_HEIGHT;
          const isHour = minute === 0;
          return (
            <div
              key={time}
              className="absolute -translate-y-1/2"
              style={{ top: `${topPosition}px`, right: "0.5rem" }}
            >
              <span
                className={`text-xs ${
                  isHour ? "font-semibold text-slate-400" : "text-slate-500"
                }`}
              >
                {time}
              </span>
            </div>
          );
        })}
      </div>

      {/* Grid Lines */}
      <div className="absolute inset-y-0 left-20 right-0">
        {timeSlots.map((time, index) => {
          const [hour, minute] = time.split(":").map(Number);
          const topPosition =
            ((hour - DAY_START_HOUR) * 60 + minute) * MINUTE_HEIGHT;
          const isHour = minute === 0;
          return (
            <div
              key={`line-${time}`}
              className={`absolute w-full ${
                isHour
                  ? "border-t border-slate-700"
                  : "border-t border-dashed border-slate-800"
              }`}
              style={{ top: `${topPosition}px` }}
            ></div>
          );
        })}
      </div>

      {/* Task Cards - only show tasks with a scheduled time */}
      <div className="absolute inset-y-0 left-24 right-0">
        {scheduledTasks.map((task) => {
          const colInfo = taskColumns.get(task.id) || {
            column: 0,
            totalColumns: 1,
          };
          return (
            <TaskCard
              key={task.id}
              task={task}
              column={colInfo.column}
              totalColumns={colInfo.totalColumns}
            />
          );
        })}
      </div>

      {/* Empty state */}
      {scheduledTasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-slate-500 text-center">
            No scheduled tasks.
            <br />
            Add a task with a start time to see it here.
          </p>
        </div>
      )}
    </div>
  );
}
