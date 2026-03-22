import React, { useContext } from "react";
import { AppContext } from "../context/AppContext.tsx";
import { AppMode } from "../types.ts";
import {
  HomeIcon,
  TimelineIcon,
  HabitsIcon,
  InboxIcon,
  ReviewIcon,
} from "./icons.tsx";

const MatrixIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-6 h-6 ${className}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 4.5v15m6-15v15m-10.5-6h15m-15-6h15"
    />
  </svg>
);

export default function BottomNav() {
  const { state, dispatch } = useContext(AppContext);

  const navItems: { mode: AppMode; label: string; icon: JSX.Element }[] = [
    { mode: "Home", label: "Home", icon: <HomeIcon /> },
    { mode: "Timeline", label: "Timeline", icon: <TimelineIcon /> },
    { mode: "Matrix", label: "Matrix", icon: <MatrixIcon /> },
    { mode: "Habits", label: "Habits", icon: <HabitsIcon /> },
    { mode: "Inbox", label: "Inbox", icon: <InboxIcon /> },
    { mode: "Review", label: "Review", icon: <ReviewIcon /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 z-30 h-16 safe-area-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-around items-center h-full">
          {navItems.map((item, index) => (
            <button
              key={item.mode}
              onClick={() => dispatch({ type: "SET_MODE", payload: item.mode })}
              className={`flex flex-col items-center justify-center gap-1 w-16 btn-press focus-ring rounded-xl py-1.5 transition-all ${
                state.mode === item.mode
                  ? "text-indigo-500 dark:text-indigo-400 scale-110 bg-indigo-500/10"
                  : "text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
              style={{
                transition: "all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              aria-current={state.mode === item.mode ? "page" : undefined}
            >
              <span
                className={
                  state.mode === item.mode ? "animate-bounce-subtle" : ""
                }
              >
                {item.icon}
              </span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
