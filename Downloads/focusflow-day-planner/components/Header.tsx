import React, { useContext } from "react";
import { AppContext } from "../context/AppContext.tsx";
import { parseAndCreateSavedItem } from "../logic/shareHandler.ts";
import { Theme } from "../types.ts";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "./icons.tsx";

const themeIcons: { [key in Theme]: JSX.Element } = {
  light: <SunIcon className="w-5 h-5" />,
  dark: <MoonIcon className="w-5 h-5" />,
  system: <ComputerDesktopIcon className="w-5 h-5" />,
};

export default function Header() {
  const { state, dispatch } = useContext(AppContext);

  const titles: { [key: string]: string } = {
    Home: "Command Center",
    Timeline: "Day Plan",
    Habits: "Habit Tracker",
    Inbox: "Inbox",
    Review: "Review",
  };

  const handleSaveLink = () => {
    const url = prompt("Paste a URL to save to your inbox:");
    if (url) {
      const newItem = parseAndCreateSavedItem(url);
      dispatch({ type: "ADD_SAVED_ITEM", payload: newItem });
      alert(`"${newItem.title}" saved to your inbox!`);
      dispatch({ type: "SET_MODE", payload: "Inbox" });
    }
  };

  const handleThemeChange = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(state.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    dispatch({ type: "SET_THEME", payload: nextTheme });
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              FocusFlow
            </h1>
            <span className="text-lg text-slate-500 dark:text-slate-400 font-medium hidden sm:inline animate-fade-in">
              | {titles[state.mode]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveLink}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-slate-700 focus-ring btn-press text-sm font-medium transition-all"
              aria-label="Save a new link"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              <span className="hidden sm:inline">Save Link</span>
            </button>
            <button
              onClick={handleThemeChange}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring btn-press transition-all"
              aria-label={`Switch to ${
                state.theme === "light" ? "dark" : "light"
              } mode`}
            >
              {themeIcons[state.theme]}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
