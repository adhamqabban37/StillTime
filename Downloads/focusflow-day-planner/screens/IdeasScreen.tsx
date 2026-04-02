import React, { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { IdeaTopic, Idea } from "../types";
import { PlusIcon } from "../components/icons";

const TOPICS: ("all" | IdeaTopic)[] = [
  "all",
  "Sports",
  "Work",
  "Personal",
  "Learning",
  "Creative",
  "Other",
];

export default function IdeasScreen() {
  const { state, dispatch } = useContext(AppContext);
  const { ideas, selectedIdeaTopic } = state;

  const filteredIdeas = useMemo(() => {
    let filtered = ideas;
    if (selectedIdeaTopic !== "all") {
      filtered = ideas.filter((idea) => idea.topic === selectedIdeaTopic);
    }
    // Sort by most recent first
    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [ideas, selectedIdeaTopic]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this idea?")) {
      dispatch({ type: "DELETE_IDEA", payload: id });
    }
  };

  const handleEdit = (idea: Idea) => {
    dispatch({ type: "SET_EDITING_IDEA", payload: idea });
  };

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Ideas Journal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Capture and organize your thoughts
          </p>
        </div>

        <button
          onClick={() => {
            dispatch({ type: "SET_EDITING_IDEA", payload: null });
            dispatch({ type: "TOGGLE_ADD_IDEA_FORM", payload: true });
          }}
          className="btn-press bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl px-4 py-3 shadow-lg shadow-indigo-500/30 transition-colors inline-flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-6 h-6" />
          <span className="text-sm font-semibold">New Idea</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-6 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() =>
              dispatch({ type: "SET_SELECTED_IDEA_TOPIC", payload: topic })
            }
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedIdeaTopic === topic
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                : "bg-white dark:bg-[#1a1a1c] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5"
            }`}
          >
            {topic === "all" ? "All Ideas" : topic}
          </button>
        ))}
      </div>

      {/* Ideas List */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1a1c] rounded-3xl p-8 text-center border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-slate-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.82 1.508-2.316a7.5 7.5 0 1 0-7.516 0c.85.496 1.508 1.333 1.508 2.316V18"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No ideas yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto mb-6">
            {selectedIdeaTopic === "all"
              ? "You haven't saved any ideas yet."
              : `You haven't saved any ideas in the ${selectedIdeaTopic} topic.`}
          </p>
          <button
            onClick={() => {
              dispatch({ type: "SET_EDITING_IDEA", payload: null });
              dispatch({ type: "TOGGLE_ADD_IDEA_FORM", payload: true });
            }}
            className="text-indigo-500 font-medium hover:text-indigo-600 inline-flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" /> Add your first idea
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              onClick={() => handleEdit(idea)}
              className="bg-white dark:bg-[#1a1a1c] border border-slate-100 dark:border-white/5 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                  {idea.topic}
                </span>
                <button
                  onClick={(e) => handleDelete(e, idea.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Delete idea"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-800 dark:text-slate-100 line-clamp-2">
                {idea.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap line-clamp-4 flex-grow">
                {idea.content}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 text-xs text-slate-400 flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                {new Date(idea.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year:
                    new Date(idea.createdAt).getFullYear() !==
                    new Date().getFullYear()
                      ? "numeric"
                      : undefined,
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
