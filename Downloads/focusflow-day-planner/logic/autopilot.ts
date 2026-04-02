import { Task, Habit, AutopilotSlot, CalendarEvent } from "../types.ts";
import { DAY_START_HOUR, DAY_END_HOUR } from "../constants.ts";

interface TimeBlock {
  start: number; // minutes from midnight
  end: number;
}

/**
 * Build the autopilot schedule by placing unscheduled/incomplete tasks
 * into free slots between DAY_START_HOUR and DAY_END_HOUR.
 *
 * Rules:
 *  - Prioritize high-priority (matrixQuadrant "do") tasks
 *  - Schedule deep work (>= 45 min) earlier in the day
 *  - Avoid overlapping with existing scheduled tasks & calendar events
 *  - Respect task durations
 */
export function generateAutopilotSchedule(
  tasks: Task[],
  calendarEvents: CalendarEvent[] = [],
): AutopilotSlot[] {
  const dayStartMin = DAY_START_HOUR * 60;
  const dayEndMin = DAY_END_HOUR * 60;
  const today = new Date().toLocaleDateString("en-CA");

  // Gather occupied blocks from already-scheduled incomplete tasks
  const occupied: TimeBlock[] = [];

  for (const task of tasks) {
    if (!task.startTime || task.completed) continue;
    if (task.snoozedTo && task.snoozedTo > today) continue;
    const [h, m] = task.startTime.split(":").map(Number);
    const start = h * 60 + m;
    occupied.push({ start, end: start + task.duration });
  }

  // Add calendar events as occupied blocks
  for (const event of calendarEvents) {
    if (event.isAllDay) continue;
    const [h, m] = event.startTime.split(":").map(Number);
    const start = h * 60 + m;
    occupied.push({ start, end: start + event.duration });
  }

  // Sort occupied blocks
  occupied.sort((a, b) => a.start - b.start);

  // Compute free slots
  const freeSlots: TimeBlock[] = [];
  let cursor = dayStartMin;

  for (const block of occupied) {
    if (block.start > cursor) {
      freeSlots.push({ start: cursor, end: block.start });
    }
    cursor = Math.max(cursor, block.end);
  }
  if (cursor < dayEndMin) {
    freeSlots.push({ start: cursor, end: dayEndMin });
  }

  // Get tasks that need scheduling: incomplete, no startTime or snoozed-to-today
  const unscheduledTasks = tasks.filter((t) => {
    if (t.completed) return false;
    if (t.snoozedTo && t.snoozedTo > today) return false;
    // Include tasks without a time, or tasks that already have a time (we'll reschedule)
    // Only include tasks that don't have a startTime set
    if (
      t.startTime &&
      tasks.some((existing) => existing.id === t.id && existing.startTime)
    ) {
      return false;
    }
    return true;
  });

  // Sort: high priority first, then deep work (longer tasks) first for morning slots
  const priorityOrder: Record<string, number> = {
    do: 0,
    schedule: 1,
    delegate: 2,
    delete: 3,
  };

  const sorted = [...unscheduledTasks].sort((a, b) => {
    const pa = priorityOrder[a.matrixQuadrant || "schedule"] ?? 1;
    const pb = priorityOrder[b.matrixQuadrant || "schedule"] ?? 1;
    if (pa !== pb) return pa - pb;
    // Deep work (longer) earlier
    return b.duration - a.duration;
  });

  // Place tasks into free slots
  const result: AutopilotSlot[] = [];
  const usedSlots = freeSlots.map((s) => ({ ...s })); // mutable copy

  for (const task of sorted) {
    let placed = false;
    for (const slot of usedSlots) {
      const available = slot.end - slot.start;
      if (available >= task.duration) {
        const startMin = slot.start;
        const endMin = startMin + task.duration;

        result.push({
          taskId: task.id,
          title: task.title,
          start: minutesToTime(startMin),
          end: minutesToTime(endMin),
          duration: task.duration,
        });

        // Shrink the slot
        slot.start = endMin;
        placed = true;
        break;
      }
    }
    // If not placed, task doesn't fit anywhere – skip it
  }

  return result;
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
