import React, { useContext } from "react";
import { SavedItem } from "../types.ts";
import { AppContext } from "../context/AppContext.tsx";

const SourceIcon = ({ source }: { source: string }) => {
  const baseClass = "w-5 h-5";
  if (source === "YouTube")
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={baseClass}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816Zm-10.615 12.816V8l6 4-6 4Z" />
      </svg>
    );
  if (source === "Instagram")
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={baseClass}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069Zm0 1.8a6.937 6.937 0 0 0-2.208.387A5.054 5.054 0 0 0 5.96 8.283a6.937 6.937 0 0 0-.387 2.208c-.053 1.232-.064 1.596-.064 4.509s.011 3.277.064 4.509c.097 2.262 1.103 3.855 3.338 4.051.97.078 1.28.09 3.703.09s2.733-.012 3.703-.09c2.234-.196 3.24-1.79 3.338-4.051.053-1.232.064-1.596.064-4.509s-.011-3.277-.064-4.509c-.097-2.262-1.103-3.855-3.338-4.051-.97-.078-1.28-.09-3.703-.09ZM12 7.25a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5Zm0 1.8a2.95 2.95 0 1 1 0 5.9 2.95 2.95 0 0 1 0-5.9Zm4.865-3.225a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z" />
      </svg>
    );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={baseClass}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.75 13.5H12v-1.5h.75v1.5Zm0-3H12V6h.75v6.75Z" />
    </svg>
  );
};

export default function SavedItemCard({ item }: { item: SavedItem }) {
  const { dispatch } = useContext(AppContext);

  const handleCardClick = () => {
    // If there's a URL, open it directly
    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    } else {
      // Otherwise show action panel
      dispatch({ type: "SET_ACTION_PANEL_ITEM", payload: item });
    }
  };

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "SET_ACTION_PANEL_ITEM", payload: item });
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-slate-900/40 rounded-2xl shadow-lg p-4 border border-white/5 flex gap-4 items-center cursor-pointer hover:bg-slate-800/60 transition-colors"
    >
      {item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-24 h-16 object-cover rounded-xl bg-slate-800"
        />
      ) : (
        <div className="w-24 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
          <SourceIcon source={item.source} />
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <h3 className="font-bold text-slate-100 truncate">{item.title}</h3>
        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
          <div className="flex items-center gap-1">
            <SourceIcon source={item.source} /> {item.source}
          </div>
          {item.duration && <span>&bull; {item.duration} min</span>}
        </div>
      </div>
      {item.url && (
        <button
          onClick={handleOptionsClick}
          className="p-2 text-slate-400 hover:bg-slate-700 rounded-xl transition-colors"
          title="More options"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
