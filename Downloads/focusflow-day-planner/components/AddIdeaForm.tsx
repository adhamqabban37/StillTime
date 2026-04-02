import React, {
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { AppContext } from "../context/AppContext";
import { IdeaTopic, Idea } from "../types";
import { PlusIcon } from "./icons";

const TOPICS: IdeaTopic[] = [
  "Sports",
  "Work",
  "Personal",
  "Learning",
  "Creative",
  "Other",
];

export default function AddIdeaForm() {
  const { state, dispatch } = useContext(AppContext);
  const editingIdea = state.editingIdea;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftIdeaIdRef = useRef<string | null>(editingIdea?.id || null);
  const createdDraftRef = useRef(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [body, setBody] = useState(
    editingIdea
      ? [editingIdea.title, editingIdea.content].filter(Boolean).join("\n")
      : "",
  );
  const [topic, setTopic] = useState<IdeaTopic>(
    editingIdea?.topic ||
      (state.selectedIdeaTopic === "all" ? "Work" : state.selectedIdeaTopic),
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(body.length, body.length);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [body.length]);

  const toIdeaFields = useCallback((raw: string) => {
    const normalized = raw.replace(/\r\n/g, "\n").trim();
    const [firstLine = "", ...rest] = normalized.split("\n");
    return {
      title: firstLine.trim() || "Untitled",
      content: rest.join("\n").trim(),
    };
  }, []);

  const persistDraft = useCallback(() => {
    if (!body.trim()) return;
    const fields = toIdeaFields(body);

    if (editingIdea || draftIdeaIdRef.current) {
      const id = draftIdeaIdRef.current || editingIdea!.id;
      draftIdeaIdRef.current = id;
      dispatch({
        type: "UPDATE_IDEA",
        payload: {
          ...(editingIdea || {
            id,
            createdAt: new Date().toISOString(),
            tags: [],
          }),
          id,
          title: fields.title,
          content: fields.content,
          topic,
          updatedAt: new Date().toISOString(),
        },
      });
    } else {
      const id = crypto.randomUUID();
      draftIdeaIdRef.current = id;
      createdDraftRef.current = true;
      const newIdea: Idea = {
        id,
        title: fields.title,
        content: fields.content,
        topic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
      };
      dispatch({ type: "ADD_IDEA", payload: newIdea });
    }

    setLastSavedAt(new Date());
  }, [body, dispatch, editingIdea, toIdeaFields, topic]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      persistDraft();
    }, 280);
    return () => window.clearTimeout(timer);
  }, [body, topic, persistDraft]);

  const handleClose = () => {
    if (!body.trim() && createdDraftRef.current && draftIdeaIdRef.current) {
      dispatch({ type: "DELETE_IDEA", payload: draftIdeaIdRef.current });
    } else {
      persistDraft();
    }

    dispatch({ type: "TOGGLE_ADD_IDEA_FORM", payload: false });
  };

  const firstLine = body.split("\n")[0]?.trim() || "Untitled";

  return (
    <div className="fixed inset-0 bg-slate-900/35 dark:bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
      <div
        className="bg-white dark:bg-[#111116] w-full sm:w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex sticky top-0 bg-white/90 dark:bg-[#111116]/95 backdrop-blur-xl justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-white/5 z-10 shrink-0">
          <button
            onClick={handleClose}
            className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors"
          >
            Done
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[180px] sm:max-w-[360px]">
              {firstLine}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {lastSavedAt
                ? `Auto-saved ${lastSavedAt.toLocaleTimeString()}`
                : "Auto-save enabled"}
            </p>
          </div>
          <button
            onClick={() => setBody("")}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            aria-label="Clear note"
          >
            Clear
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 overflow-x-auto">
          <div className="flex flex-nowrap gap-2">
            {TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  topic === t
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/25"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-full min-h-[58vh] bg-transparent border-none outline-none p-5 text-[17px] leading-7 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
            placeholder="Start typing..."
            aria-label="Idea note editor"
          />
        </div>

        <div className="px-4 py-3 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span className="inline-flex items-center gap-1">
            <PlusIcon className="w-3.5 h-3.5" />
            Apple Notes style quick capture
          </span>
          <span>
            {body.trim() ? `${body.trim().length} chars` : "Empty note"}
          </span>
        </div>
      </div>
    </div>
  );
}
