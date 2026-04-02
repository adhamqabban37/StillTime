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
    Accountability: "Habit Tracker",
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
            <h1
              className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent cursor-pointer"
              onClick={() => dispatch({ type: "SET_MODE", payload: "Home" })}
            >
              FocusFlow
            </h1>
            <span className="text-lg text-slate-500 dark:text-slate-400 font-medium hidden sm:inline animate-fade-in">
              | {titles[state.mode] || state.mode}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                dispatch({ type: "SET_MODE", payload: "Settings" })
              }
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring btn-press transition-all"
              aria-label="Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M7.84 1.804A1.5 1.5 0 0 1 9.279 1h1.442a1.5 1.5 0 0 1 1.44 .804l.119.239a5.008 5.008 0 0 0 2.213 2.213l.239-.119a1.5 1.5 0 0 1 1.83.218l1.019 1.019a1.5 1.5 0 0 1 .218 1.83l-.119.239a5.008 5.008 0 0 0 2.213 2.213l.239.119a1.5 1.5 0 0 1 .804 1.44v1.442a1.5 1.5 0 0 1-.804 1.44l-.239.119a5.008 5.008 0 0 0-2.213 2.213l.119.239a1.5 1.5 0 0 1-.218 1.83l-1.019 1.019a1.5 1.5 0 0 1-1.83.218l-.239-.119a5.008 5.008 0 0 0-2.213 2.213l-.119.239a1.5 1.5 0 0 1-1.44.804H9.28a1.5 1.5 0 0 1-1.44-.804l-.119-.239a5.008 5.008 0 0 0-2.213-2.213l-.239.119a1.5 1.5 0 0 1-1.83-.218l-1.019-1.019a1.5 1.5 0 0 1-.218-1.83l.119-.239a5.008 5.008 0 0 0-2.213-2.213l-.239-.119a1.5 1.5 0 0 1-.804-1.44v-1.442a1.5 1.5 0 0 1 .804-1.44l.239-.119a5.008 5.008 0 0 0 2.213-2.213l-.119-.239a1.5 1.5 0 0 1 .218-1.83l1.019-1.019a1.5 1.5 0 0 1 1.83-.218l.239.119a5.008 5.008 0 0 0 2.213-2.213l.119-.239ZM10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
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
