import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext.tsx";
import SavedItemCard from "../components/SavedItemCard.tsx";
import { useGemini } from "../hooks/useGemini.ts";
import { SparklesIcon } from "../components/icons.tsx";

export default function InboxScreen() {
  const { state, dispatch } = useContext(AppContext);
  const { analyzeInboxItem, isLoading, error: geminiError } = useGemini();
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const inboxItems = state.savedItems.filter((item) => item.status === "inbox");

  const handleAnalyzeItem = async (itemId: string) => {
    const item = state.savedItems.find((i) => i.id === itemId);
    if (!item) return;

    setAnalyzingId(itemId);
    const analysis = await analyzeInboxItem(item);

    if (analysis) {
      dispatch({
        type: "UPDATE_SAVED_ITEM",
        payload: {
          id: itemId,
          aiCategory: analysis.category,
          aiPriority: analysis.priority as "high" | "medium" | "low",
          aiSummary: analysis.summary,
        },
      });
      dispatch({
        type: "SHOW_TOAST",
        payload: {
          message: `✨ Analyzed: ${analysis.category} (${analysis.priority})`,
          icon: "🤖",
        },
      });
    } else {
      dispatch({
        type: "SHOW_TOAST",
        payload: {
          message: "Failed to analyze item. Check console for details.",
          icon: "❌",
        },
      });
    }
    setAnalyzingId(null);
  };

  const handleAnalyzeAll = async () => {
    for (const item of inboxItems) {
      if (!item.aiCategory) {
        await handleAnalyzeItem(item.id);
      }
    }
  };

  return (
    <div className="space-y-4">
      {inboxItems.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-400">
            {inboxItems.length} item{inboxItems.length !== 1 ? "s" : ""} to
            process
          </p>
          <button
            onClick={handleAnalyzeAll}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-all font-medium"
          >
            <SparklesIcon className="w-4 h-4" />
            {isLoading ? "Analyzing..." : "AI Analyze All"}
          </button>
        </div>
      )}

      {inboxItems.length > 0 ? (
        inboxItems.map((item) => (
          <div key={item.id} className="relative">
            <SavedItemCard item={item} />
            {item.aiCategory && (
              <div className="mt-2 p-3 bg-indigo-900/20 rounded-xl border border-indigo-700/30">
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                      item.aiPriority === "high"
                        ? "bg-red-900/50 text-red-400"
                        : item.aiPriority === "medium"
                        ? "bg-amber-900/50 text-amber-400"
                        : "bg-emerald-900/50 text-emerald-400"
                    }`}
                  >
                    {item.aiPriority}
                  </span>
                  <span className="text-slate-400">{item.aiCategory}</span>
                </div>
                {item.aiSummary && (
                  <p className="mt-1 text-xs text-slate-500 italic">
                    {item.aiSummary}
                  </p>
                )}
              </div>
            )}
            {!item.aiCategory && (
              <button
                onClick={() => handleAnalyzeItem(item.id)}
                disabled={analyzingId === item.id}
                className="mt-2 w-full py-2 text-sm text-indigo-400 hover:bg-indigo-900/20 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <SparklesIcon className="w-4 h-4" />
                {analyzingId === item.id ? "Analyzing..." : "Analyze with AI"}
              </button>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-16 px-4">
          <div className="mx-auto w-16 h-16 flex items-center justify-center bg-slate-800/50 rounded-2xl text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.12-1.588H6.88a2.25 2.25 0 0 0-2.12 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-200 mt-4">Inbox Zero!</h2>
          <p className="text-slate-500 mt-2">
            Save links from around the web to process them here.
          </p>
        </div>
      )}
    </div>
  );
}
