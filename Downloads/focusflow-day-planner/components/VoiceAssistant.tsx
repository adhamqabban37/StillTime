import React, { useState, useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext.tsx";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition.ts";
import { useGemini } from "../hooks/useGemini.ts";
import { VoiceParsedTask } from "../types.ts";
import { scheduleTaskReminder } from "../logic/notifications.ts";

const MicIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const StopIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export default function VoiceAssistant() {
  const { dispatch } = useContext(AppContext);
  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    error: speechError,
  } = useSpeechRecognition();
  const { parseVoiceTask, isLoading: aiLoading } = useGemini();
  const [isProcessing, setIsProcessing] = useState(false);

  // Process transcript when speech recognition completes
  useEffect(() => {
    if (transcript && !isListening && !isProcessing) {
      handleTranscript(transcript);
    }
  }, [transcript, isListening]);

  const handleTranscript = async (text: string) => {
    setIsProcessing(true);
    try {
      const parsed: VoiceParsedTask | null = await parseVoiceTask(text);
      if (!parsed) {
        dispatch({
          type: "SHOW_TOAST",
          payload: {
            message: "Couldn't understand that. Try again.",
            icon: "⚠️",
          },
        });
        return;
      }

      const newTask = {
        id: Date.now().toString(),
        title: parsed.title,
        duration: parsed.duration,
        type: "Task" as const,
        startTime: parsed.time || "",
        recurrence: "none" as const,
        completed: false,
        aiGenerated: true,
        snoozedTo:
          parsed.date !== new Date().toLocaleDateString("en-CA")
            ? parsed.date
            : undefined,
      };

      dispatch({ type: "ADD_TASK", payload: newTask });
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: `🎤 Added: ${parsed.title}`, icon: "✨" },
      });

      // Schedule notification
      if (parsed.time) {
        const [hours, minutes] = parsed.time.split(":").map(Number);
        const taskDate = new Date(parsed.date + "T00:00:00");
        taskDate.setHours(hours, minutes, 0, 0);
        if (taskDate.getTime() > Date.now()) {
          await scheduleTaskReminder(newTask.id, parsed.title, taskDate, 5);
        }
      }
    } catch (e) {
      console.error("Voice task creation failed:", e);
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: "Failed to create task from voice.", icon: "❌" },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicClick = () => {
    if (isProcessing || aiLoading) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className="p-3 rounded-2xl bg-slate-800/50 text-slate-600 cursor-not-allowed"
        title="Speech recognition not supported in this browser"
      >
        <MicIcon className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleMicClick}
        disabled={isProcessing || aiLoading}
        className={`relative p-3 rounded-2xl transition-all ${
          isListening
            ? "bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse"
            : isProcessing || aiLoading
              ? "bg-indigo-500/30 text-indigo-300 cursor-wait"
              : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white"
        }`}
        title={isListening ? "Stop listening" : "Voice command"}
      >
        {isListening ? (
          <StopIcon className="w-6 h-6" />
        ) : (
          <MicIcon className="w-6 h-6" />
        )}
        {isListening && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
        )}
      </button>

      {/* Listening indicator overlay */}
      {(isListening || isProcessing) && (
        <div className="absolute top-full mt-2 right-0 z-50 w-64 bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
          {isListening && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex gap-1">
                  <span
                    className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-6 bg-red-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-3 bg-red-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                  <span
                    className="w-1.5 h-5 bg-red-400 rounded-full animate-bounce"
                    style={{ animationDelay: "450ms" }}
                  />
                </div>
                <span className="text-sm font-semibold text-red-400">
                  Listening...
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Say something like "Call mom tomorrow at 3pm for 15 minutes"
              </p>
              <button
                onClick={stopListening}
                className="mt-3 w-full py-1.5 text-xs bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-colors"
              >
                Cancel
              </button>
            </>
          )}
          {isProcessing && (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-sm font-semibold text-indigo-300">
                  Processing...
                </p>
                <p className="text-xs text-slate-500 truncate">
                  "{transcript}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {speechError && (
        <div className="absolute top-full mt-2 right-0 z-50 w-64 bg-red-900/80 border border-red-500/30 rounded-xl p-3">
          <p className="text-xs text-red-300">{speechError}</p>
        </div>
      )}
    </div>
  );
}
