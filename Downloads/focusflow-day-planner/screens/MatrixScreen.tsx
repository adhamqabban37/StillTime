import React, { useContext, useState, useRef, useMemo } from "react";
import { AppContext } from "../context/AppContext.tsx";
import { Task, SavedItem, MatrixQuadrant } from "../types.ts";

// Icons
const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="m8 6 1-4h6l1 4" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const quadrantConfig: Record<
  MatrixQuadrant,
  {
    title: string;
    description: string;
    emoji: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    buttonClass: string;
  }
> = {
  do: {
    title: "Do First",
    description: "Urgent & Important",
    emoji: "🔥",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/30",
    textClass: "text-red-400",
    buttonClass: "bg-red-500/20 hover:bg-red-500/40 border-red-500/30",
  },
  schedule: {
    title: "Schedule",
    description: "Important, Not Urgent",
    emoji: "📅",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30",
    textClass: "text-blue-400",
    buttonClass: "bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/30",
  },
  delegate: {
    title: "Delegate",
    description: "Urgent, Not Important",
    emoji: "👥",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-400",
    buttonClass: "bg-amber-500/20 hover:bg-amber-500/40 border-amber-500/30",
  },
  delete: {
    title: "Eliminate",
    description: "Neither Urgent nor Important",
    emoji: "🗑️",
    bgClass: "bg-slate-500/10",
    borderClass: "border-slate-500/30",
    textClass: "text-slate-400",
    buttonClass: "bg-slate-500/20 hover:bg-slate-500/40 border-slate-500/30",
  },
};

const QuadrantCard = ({
  item,
  type,
  onQuickAction,
  isDragging,
}: {
  item: Task | SavedItem;
  type: "task" | "item";
  onQuickAction: (action: "complete" | "focus" | "delete") => void;
  isDragging?: boolean;
}) => {
  const { dispatch } = useContext(AppContext);
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = () => {
    if (type === "task") {
      dispatch({ type: "SET_CONTROL_PANEL_TASK", payload: item as Task });
    } else {
      dispatch({ type: "SET_ACTION_PANEL_ITEM", payload: item as SavedItem });
    }
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
      if (navigator.vibrate) navigator.vibrate(30);
    }, 400);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div
      onClick={handlePress}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`relative bg-white dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer transition-all touch-manipulation ${
        isDragging
          ? "opacity-50 scale-95"
          : "hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-[0.98]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
            {item.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {type === "task"
              ? `${(item as Task).duration} min • ${(item as Task).startTime}`
              : (item as SavedItem).source}
          </p>
        </div>
        {type === "task" && (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction("complete");
              }}
              className="p-1.5 bg-green-500/20 hover:bg-green-500/40 rounded-lg transition-colors touch-manipulation"
            >
              <CheckIcon className="w-3.5 h-3.5 text-green-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction("focus");
              }}
              className="p-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 rounded-lg transition-colors touch-manipulation"
            >
              <PlayIcon className="w-3.5 h-3.5 text-indigo-500" />
            </button>
          </div>
        )}
      </div>

      {/* Long press action menu */}
      {showActions && (
        <div
          className="absolute inset-0 bg-slate-900/95 rounded-xl z-10 flex items-center justify-center gap-2 p-2"
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(false);
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction("complete");
              setShowActions(false);
            }}
            className="flex flex-col items-center gap-1 p-2 bg-green-500/20 rounded-xl touch-manipulation"
          >
            <CheckIcon className="w-5 h-5 text-green-500" />
            <span className="text-[10px] text-green-400 font-bold">Done</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction("focus");
              setShowActions(false);
            }}
            className="flex flex-col items-center gap-1 p-2 bg-indigo-500/20 rounded-xl touch-manipulation"
          >
            <PlayIcon className="w-5 h-5 text-indigo-500" />
            <span className="text-[10px] text-indigo-400 font-bold">Focus</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction("delete");
              setShowActions(false);
            }}
            className="flex flex-col items-center gap-1 p-2 bg-red-500/20 rounded-xl touch-manipulation"
          >
            <TrashIcon className="w-5 h-5 text-red-500" />
            <span className="text-[10px] text-red-400 font-bold">Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

const QuickAssignButton = ({
  quadrant,
  item,
  isActive,
}: {
  quadrant: MatrixQuadrant;
  item: Task | SavedItem;
  isActive: boolean;
}) => {
  const { dispatch } = useContext(AppContext);
  const config = quadrantConfig[quadrant];

  const handleAssign = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    if ("startTime" in item) {
      dispatch({
        type: "UPDATE_TASK",
        payload: { ...item, matrixQuadrant: quadrant },
      });
    } else {
      dispatch({
        type: "UPDATE_SAVED_ITEM",
        payload: { ...item, matrixQuadrant: quadrant },
      });
    }
  };

  return (
    <button
      onClick={handleAssign}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all touch-manipulation border ${
        isActive
          ? `${config.bgClass} ${config.borderClass} ${config.textClass}`
          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
      }`}
    >
      <span>{config.emoji}</span>
      <span className="hidden sm:inline">{config.title}</span>
    </button>
  );
};

const Quadrant = ({
  quadrant,
  items,
  onQuickAction,
}: {
  quadrant: MatrixQuadrant;
  items: (Task | SavedItem)[];
  onQuickAction: (
    item: Task | SavedItem,
    action: "complete" | "focus" | "delete"
  ) => void;
}) => {
  const config = quadrantConfig[quadrant];

  return (
    <div
      className={`p-3 rounded-2xl border ${config.bgClass} ${config.borderClass} transition-all`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{config.emoji}</span>
        <div>
          <h3 className={`font-bold text-sm ${config.textClass}`}>
            {config.title}
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {config.description}
          </p>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
          {items.length}
        </span>
      </div>
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {items.map((item) => (
          <QuadrantCard
            key={item.id}
            item={item}
            type={"startTime" in item ? "task" : "item"}
            onQuickAction={(action) => onQuickAction(item, action)}
          />
        ))}
        {items.length === 0 && (
          <div className="text-center py-6 text-slate-500 dark:text-slate-600">
            <p className="text-sm font-medium">Empty</p>
            <p className="text-[10px]">Assign items here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function MatrixScreen() {
  const { state, dispatch } = useContext(AppContext);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const allItems = useMemo(
    () => [
      ...state.tasks.filter((t) => !t.completed),
      ...state.savedItems.filter((i) => i.status === "inbox"),
    ],
    [state.tasks, state.savedItems]
  );

  const uncategorizedItems = useMemo(
    () => allItems.filter((i) => !i.matrixQuadrant),
    [allItems]
  );

  const quadrants: Record<MatrixQuadrant, (Task | SavedItem)[]> = useMemo(
    () => ({
      do: allItems.filter((i) => i.matrixQuadrant === "do"),
      schedule: allItems.filter((i) => i.matrixQuadrant === "schedule"),
      delegate: allItems.filter((i) => i.matrixQuadrant === "delegate"),
      delete: allItems.filter((i) => i.matrixQuadrant === "delete"),
    }),
    [allItems]
  );

  const handleQuickAction = (
    item: Task | SavedItem,
    action: "complete" | "focus" | "delete"
  ) => {
    if ("startTime" in item) {
      const task = item as Task;
      switch (action) {
        case "complete":
          dispatch({
            type: "COMPLETE_TASK",
            payload: { taskId: task.id, completedAt: new Date().toISOString() },
          });
          break;
        case "focus":
          dispatch({ type: "START_FOCUS", payload: task });
          dispatch({ type: "SET_MODE", payload: "Focus" });
          break;
        case "delete":
          dispatch({ type: "DELETE_TASK", payload: task.id });
          break;
      }
    } else {
      const savedItem = item as SavedItem;
      if (action === "delete") {
        dispatch({ type: "DELETE_SAVED_ITEM", payload: savedItem.id });
      }
    }
  };

  // Stats
  const totalItems = allItems.length;
  const categorizedCount = totalItems - uncategorizedItems.length;
  const doCount = quadrants.do.length;

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <span>📊</span> Eisenhower Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Prioritize by urgency & importance
          </p>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-2 py-1 rounded text-xs font-bold transition-all touch-manipulation ${
              viewMode === "grid"
                ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                : "text-slate-500"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-2 py-1 rounded text-xs font-bold transition-all touch-manipulation ${
              viewMode === "list"
                ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                : "text-slate-500"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 p-2.5 rounded-xl text-center">
          <p className="text-lg font-black text-slate-800 dark:text-white">
            {totalItems}
          </p>
          <p className="text-[8px] font-bold text-slate-500 uppercase">Total</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 p-2.5 rounded-xl text-center">
          <p className="text-lg font-black text-red-500">{doCount}</p>
          <p className="text-[8px] font-bold text-slate-500 uppercase">
            🔥 Do First
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 p-2.5 rounded-xl text-center">
          <p className="text-lg font-black text-amber-500">
            {uncategorizedItems.length}
          </p>
          <p className="text-[8px] font-bold text-slate-500 uppercase">
            ⚠️ Unsorted
          </p>
        </div>
      </div>

      {/* Uncategorized Items - Quick Assign */}
      {uncategorizedItems.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <div>
              <h3 className="font-bold text-sm text-amber-700 dark:text-amber-400">
                Quick Assign
              </h3>
              <p className="text-[10px] text-amber-600 dark:text-amber-500">
                Tap buttons to categorize
              </p>
            </div>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {uncategorizedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-amber-200 dark:border-amber-700/30"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {"startTime" in item
                        ? `${(item as Task).duration} min`
                        : (item as SavedItem).source}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(Object.keys(quadrantConfig) as MatrixQuadrant[]).map(
                    (q) => (
                      <QuickAssignButton
                        key={q}
                        quadrant={q}
                        item={item}
                        isActive={item.matrixQuadrant === q}
                      />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matrix Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(quadrantConfig) as MatrixQuadrant[]).map((q) => (
            <Quadrant
              key={q}
              quadrant={q}
              items={quadrants[q]}
              onQuickAction={handleQuickAction}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {(Object.keys(quadrantConfig) as MatrixQuadrant[]).map((q) => {
            const config = quadrantConfig[q];
            const items = quadrants[q];
            if (items.length === 0) return null;
            return (
              <div
                key={q}
                className={`p-3 rounded-2xl border ${config.bgClass} ${config.borderClass}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>{config.emoji}</span>
                  <h3 className={`font-bold text-sm ${config.textClass}`}>
                    {config.title}
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    ({items.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <QuadrantCard
                      key={item.id}
                      item={item}
                      type={"startTime" in item ? "task" : "item"}
                      onQuickAction={(action) =>
                        handleQuickAction(item, action)
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">
            No Items to Prioritize
          </h3>
          <p className="text-sm text-slate-500">
            Add tasks or save items to your inbox to get started
          </p>
        </div>
      )}
    </div>
  );
}
