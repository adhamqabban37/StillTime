import React, { useContext, useState, useRef, useCallback } from "react";
import { Task } from "../types.ts";
import { AppContext } from "../context/AppContext.tsx";
import { DAY_START_HOUR, DAY_END_HOUR, MINUTE_HEIGHT } from "../constants.ts";
import CategoryTag from "./CategoryTag.tsx";

interface TaskCardProps {
  task: Task;
  column?: number;
  totalColumns?: number;
}

export default function TaskCard({
  task,
  column = 0,
  totalColumns = 1,
}: TaskCardProps) {
  const { dispatch } = useContext(AppContext);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [previewTime, setPreviewTime] = useState<string | null>(null);
  const dragStartY = useRef(0);
  const originalTop = useRef(0);
  const hasDragged = useRef(false);
  const activePointerId = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle optional startTime and duration
  const startTime = task.startTime || "09:00";
  const duration = task.duration || 30;

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const top = ((startHour - DAY_START_HOUR) * 60 + startMinute) * MINUTE_HEIGHT;
  const height = duration * MINUTE_HEIGHT;

  // Calculate width and left position for side-by-side layout
  const widthPercent = totalColumns > 1 ? 100 / totalColumns - 1 : 100;
  const leftPercent = column * (100 / totalColumns);

  // Calculate preview time from offset
  const calculateTimeFromOffset = useCallback(
    (offset: number): string => {
      const newTop = originalTop.current + offset;
      const totalMinutes = Math.round(newTop / MINUTE_HEIGHT / 5) * 5;
      const newHour = Math.floor(totalMinutes / 60) + DAY_START_HOUR;
      const newMinute = ((totalMinutes % 60) + 60) % 60;
      const clampedHour = Math.max(
        DAY_START_HOUR,
        Math.min(DAY_END_HOUR - 1, newHour),
      );
      const clampedMinute =
        clampedHour === DAY_END_HOUR - 1
          ? Math.min(Math.max(0, newMinute), 60 - (duration % 60 || 60))
          : Math.max(0, newMinute);
      return `${clampedHour.toString().padStart(2, "0")}:${clampedMinute
        .toString()
        .padStart(2, "0")}`;
    },
    [duration],
  );

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasDragged.current && !suppressClick.current) {
      dispatch({ type: "SET_CONTROL_PANEL_TASK", payload: task });
    }
    suppressClick.current = false;
    hasDragged.current = false;
  };

  const finishDrag = useCallback(() => {
    window.dispatchEvent(new Event("focusflow:unlockSwipe"));

    if (hasDragged.current && Math.abs(dragOffset) > 5) {
      const newStartTime = calculateTimeFromOffset(dragOffset);

      if (newStartTime !== startTime) {
        dispatch({
          type: "UPDATE_TASK",
          payload: { ...task, startTime: newStartTime },
        });
        dispatch({
          type: "SHOW_TOAST",
          payload: { message: `📅 Moved to ${newStartTime}` },
        });
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }

    setIsDragging(false);
    setDragOffset(0);
    setPreviewTime(null);
    activePointerId.current = null;
    suppressClick.current = hasDragged.current;
  }, [calculateTimeFromOffset, dispatch, dragOffset, startTime, task]);

  const startDragging = useCallback(
    (clientY: number) => {
      setIsDragging(true);
      hasDragged.current = false;
      dragStartY.current = clientY;
      originalTop.current = top;

      // Haptic feedback on start
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }

      window.dispatchEvent(new Event("focusflow:lockSwipe"));
    },
    [top],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      activePointerId.current = e.pointerId;
      cardRef.current?.setPointerCapture(e.pointerId);
      startDragging(e.clientY);
    },
    [startDragging],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      if (activePointerId.current !== e.pointerId) return;

      e.preventDefault();
      e.stopPropagation();

      const delta = e.clientY - dragStartY.current;
      if (Math.abs(delta) > 3) {
        hasDragged.current = true;
      }
      setDragOffset(delta);
      setPreviewTime(calculateTimeFromOffset(delta));
    },
    [calculateTimeFromOffset, isDragging],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerId.current !== e.pointerId) return;
      e.stopPropagation();
      cardRef.current?.releasePointerCapture(e.pointerId);
      finishDrag();
    },
    [finishDrag],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerId.current !== e.pointerId) return;
      e.stopPropagation();
      cardRef.current?.releasePointerCapture(e.pointerId);
      finishDrag();
    },
    [finishDrag],
  );

  const cardBg =
    task.type === "Habit"
      ? "bg-teal-900/60 border-teal-700/50 hover:bg-teal-800/70"
      : "bg-indigo-900/60 border-indigo-700/50 hover:bg-indigo-800/70";
  const completedClass = task.completed ? "opacity-50" : "";

  return (
    <div
      ref={cardRef}
      className={`absolute p-2 rounded-xl border ${cardBg} ${completedClass} ${
        isDragging
          ? "opacity-90 shadow-2xl shadow-indigo-500/40 z-50 scale-[1.02] ring-2 ring-indigo-400/50"
          : ""
      } transition-all duration-200 group cursor-pointer overflow-hidden select-none backdrop-blur-sm touch-none`}
      style={{
        top: `${top + dragOffset}px`,
        height: `${height - 4}px`,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      onClick={handleCardClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      aria-label={`Task: ${task.title}, from ${startTime} for ${duration} minutes. Long press and drag to reschedule.`}
    >
      {/* Time preview bubble when dragging */}
      {isDragging && previewTime && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg whitespace-nowrap z-50 animate-pulse">
          {previewTime}
        </div>
      )}

      {/* Drag handle indicator */}
      <div
        className={`absolute top-1 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full transition-all ${
          isDragging ? "bg-indigo-400 w-12" : "bg-white/30"
        }`}
      />

      <div className="flex flex-col h-full pt-2">
        <div className="flex-grow">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-semibold text-sm text-slate-100 ${
                task.completed ? "line-through" : ""
              }`}
            >
              {task.title}
            </h3>
            {task.category && <CategoryTag category={task.category} />}
          </div>
          <p className="text-xs text-slate-400">
            {duration} min • {task.type}
          </p>
        </div>

        {/* Visual drag hint on hover */}
        {!isDragging && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
            Hold to drag
          </div>
        )}
      </div>
    </div>
  );
}
