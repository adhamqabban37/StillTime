import React, { useContext, useEffect, useState } from "react";
import { Task } from "../types.ts";
import { AppContext } from "../context/AppContext.tsx";
import { useTimer } from "../hooks/useTimer.ts";
import { PauseIcon, PlayIcon, StopIcon } from "../components/icons.tsx";

const POMODORO_WORK = 25; // 25 minutes work
const POMODORO_BREAK = 5; // 5 minutes break

export default function FocusScreen({ task }: { task: Task }) {
  const { dispatch } = useContext(AppContext);
  const [isPomodoroMode, setIsPomodoroMode] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);

  const currentDuration = isPomodoroMode
    ? isBreak
      ? POMODORO_BREAK
      : POMODORO_WORK
    : task.duration;

  const handleComplete = () => {
    if (isPomodoroMode && !isBreak) {
      // Work session complete, start break
      setPomodorosCompleted((prev) => prev + 1);
      setIsBreak(true);
      return;
    }

    if (isPomodoroMode && isBreak) {
      // Break complete, start another work session
      setIsBreak(false);
      return;
    }

    // Regular mode or final completion
    console.log(`Task "${task.title}" completed!`);
    dispatch({ type: "COMPLETE_TASK", payload: { taskId: task.id } });
    if (task.linkedItemId) {
      dispatch({
        type: "UPDATE_SAVED_ITEM",
        payload: { id: task.linkedItemId, status: "completed" },
      });
    }
    dispatch({ type: "END_FOCUS" });
  };

  const { minutes, seconds, isActive, progress, start, pause, reset } =
    useTimer(currentDuration, handleComplete);

  // Auto-start the timer when the component mounts
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset timer when switching between work/break in Pomodoro mode
  useEffect(() => {
    if (isPomodoroMode) {
      reset();
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBreak]);

  const handleEndFocus = () => {
    if (
      window.confirm("Are you sure you want to end this focus session early?")
    ) {
      dispatch({ type: "END_FOCUS" });
    }
  };

  const handleMarkComplete = () => {
    if (window.confirm("Mark this task as complete?")) {
      dispatch({ type: "COMPLETE_TASK", payload: { taskId: task.id } });
      if (task.linkedItemId) {
        dispatch({
          type: "UPDATE_SAVED_ITEM",
          payload: { id: task.linkedItemId, status: "completed" },
        });
      }
      dispatch({ type: "END_FOCUS" });
    }
  };

  const handleReschedule = () => {
    alert(
      "Reschedule feature not implemented in MVP. Let's end the session for now."
    );
    dispatch({ type: "END_FOCUS" });
    dispatch({ type: "SET_EDITING_TASK", payload: task });
  };

  const togglePomodoroMode = () => {
    setIsPomodoroMode(!isPomodoroMode);
    setIsBreak(false);
    setPomodorosCompleted(0);
  };

  const bgColor = isBreak ? "bg-teal-900" : "bg-slate-900";

  return (
    <div
      className={`fixed inset-0 ${bgColor} z-50 flex flex-col items-center justify-center text-white p-4 animate-fade-in transition-colors duration-500`}
    >
      <div className="w-full max-w-md text-center">
        {/* Pomodoro Toggle */}
        <div className="mb-4">
          <button
            onClick={togglePomodoroMode}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isPomodoroMode
                ? "bg-red-500 text-white"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            🍅 Pomodoro Mode {isPomodoroMode ? "ON" : "OFF"}
          </button>
        </div>

        {isPomodoroMode && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="text-slate-300">
              {isBreak ? "☕ Break Time" : "💪 Focus Time"}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">
              🍅 {pomodorosCompleted} completed
            </span>
          </div>
        )}

        <p className="text-lg text-slate-300 mb-2">
          {isBreak ? "Taking a break from:" : "Focusing on:"}
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold mb-8 truncate"
          title={task.title}
        >
          {task.title}
        </h1>

        <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto mb-12">
          {/* Outer glow ring */}
          <div
            className={`absolute inset-0 rounded-full blur-xl opacity-30 ${
              isBreak ? "bg-teal-500" : "bg-indigo-500"
            } ${isActive ? "animate-pulse" : ""}`}
            style={{ transform: "scale(1.1)" }}
          />

          {/* Rotating particles */}
          <div
            className={`absolute inset-0 ${isActive ? "animate-spin" : ""}`}
            style={{ animationDuration: "20s" }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 rounded-full ${
                  isBreak ? "bg-teal-400" : "bg-indigo-400"
                } opacity-60`}
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${i * 45}deg) translateY(-140px)`,
                }}
              />
            ))}
          </div>

          <svg className="w-full h-full relative z-10" viewBox="0 0 100 100">
            {/* Background gradient */}
            <defs>
              <linearGradient
                id="timerGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={isBreak ? "#14b8a6" : "#6366f1"} />
                <stop
                  offset="50%"
                  stopColor={isBreak ? "#2dd4bf" : "#818cf8"}
                />
                <stop
                  offset="100%"
                  stopColor={isBreak ? "#5eead4" : "#a5b4fc"}
                />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background circle */}
            <circle
              className="text-slate-700/50"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
            />

            {/* Secondary track (subtle) */}
            <circle
              className="text-slate-600/30"
              strokeWidth="2"
              stroke="currentColor"
              fill="transparent"
              r="38"
              cx="50"
              cy="50"
            />

            {/* Progress circle with gradient and glow */}
            <circle
              stroke="url(#timerGradient)"
              strokeWidth="7"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
              strokeLinecap="round"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
              filter="url(#glow)"
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
                transition: "stroke-dashoffset 1s linear",
              }}
            />

            {/* Inner decorative ring */}
            <circle
              className={isBreak ? "text-teal-500/20" : "text-indigo-500/20"}
              strokeWidth="1"
              stroke="currentColor"
              fill="transparent"
              r="32"
              cx="50"
              cy="50"
              strokeDasharray="4 4"
            />
          </svg>

          {/* Time display with better styling */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <span
              className={`text-6xl md:text-7xl font-mono font-bold tracking-tight ${
                isActive ? "" : "opacity-70"
              }`}
            >
              {String(minutes).padStart(2, "0")}:
              {String(seconds).padStart(2, "0")}
            </span>
            <span
              className={`text-sm mt-2 ${
                isBreak ? "text-teal-400" : "text-indigo-400"
              } font-medium`}
            >
              {Math.round(progress)}% complete
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={isActive ? pause : start}
            className="flex items-center justify-center w-20 h-20 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label={isActive ? "Pause timer" : "Resume timer"}
          >
            {isActive ? (
              <PauseIcon className="w-10 h-10" />
            ) : (
              <PlayIcon className="w-10 h-10 pl-1" />
            )}
          </button>
          <button
            onClick={handleEndFocus}
            className="flex items-center justify-center w-16 h-16 bg-red-500/80 rounded-full text-white hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="End focus session"
          >
            <StopIcon className="w-8 h-8" />
          </button>
        </div>

        <button
          onClick={handleReschedule}
          className="text-slate-400 hover:text-white transition-colors"
        >
          Reschedule Task
        </button>

        {isPomodoroMode && (
          <button
            onClick={handleMarkComplete}
            className="block mx-auto mt-4 text-teal-400 hover:text-teal-300 transition-colors font-medium"
          >
            ✓ Mark Task Complete
          </button>
        )}

        <div className="mt-12 text-center text-slate-400 text-sm">
          <p className="font-semibold">
            {isPomodoroMode ? "🍅 Pomodoro Focus Mode" : "Immersive Focus Mode"}
          </p>
          <p>
            {isBreak ? "Relax and recharge!" : "All distractions are hidden."}
          </p>
        </div>
      </div>
    </div>
  );
}
