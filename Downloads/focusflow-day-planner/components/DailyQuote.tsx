import React from "react";
import { getDailyQuote } from "../logic/quotes.ts";

export default function DailyQuote() {
  const { quote, author } = getDailyQuote();

  return (
    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-2xl p-4 border border-indigo-800/50">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🌅</span>
        <div>
          <p className="text-slate-200 italic">"{quote}"</p>
          <p className="text-sm text-slate-400 mt-1">— {author}</p>
        </div>
      </div>
    </div>
  );
}
