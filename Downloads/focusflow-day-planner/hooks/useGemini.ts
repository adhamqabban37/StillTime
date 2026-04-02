import { useState, useCallback } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import {
  SuggestionType,
  MoodLevel,
  Task,
  SavedItem,
  DailySummary,
  ParsedTaskFromNL,
  VoiceParsedTask,
} from "../types.ts";

// Primary: NVIDIA NIM API (OpenAI-compatible)
const NVIDIA_API_KEY = (import.meta as any).env?.VITE_NVIDIA_API_KEY || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = "meta/llama-3.1-70b-instruct";

// Fallback: Google Gemini API
const GEMINI_API_KEY = (import.meta as any).env?.VITE_API_KEY || "";

// Helper to safely get Gemini response text
const getResponseText = (response: any): string => {
  try {
    return response?.text || "";
  } catch (e) {
    console.error("Error getting response text:", e);
    return "";
  }
};

/**
 * Unified AI call: tries NVIDIA NIM first, falls back to Google Gemini.
 * @param prompt        The user prompt to send.
 * @param jsonMode      Whether to request a JSON response.
 * @param geminiModel   Gemini model to use in the fallback path.
 * @param geminiSchema  Optional Gemini responseSchema for structured JSON.
 */
async function callAI(
  prompt: string,
  jsonMode: boolean,
  geminiModel: string = "gemini-2.5-flash",
  geminiSchema?: any,
): Promise<string> {
  // ── Primary: NVIDIA NIM ────────────────────────────────────────────────
  if (NVIDIA_API_KEY) {
    try {
      const body: any = {
        model: NVIDIA_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
        temperature: 0.7,
      };
      if (jsonMode) {
        body.response_format = { type: "json_object" };
      }
      const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`NVIDIA API ${res.status}: ${errText}`);
      }
      const data = await res.json();
      const text: string = data.choices?.[0]?.message?.content || "";
      if (text) return text;
      throw new Error("NVIDIA returned empty response");
    } catch (e) {
      console.warn("NVIDIA API failed, falling back to Gemini:", e);
    }
  }

  // ── Fallback: Google Gemini ────────────────────────────────────────────
  if (!GEMINI_API_KEY)
    throw new Error(
      "No AI API key configured. Add VITE_API_KEY to your .env.local file.",
    );
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const config: any = {};
  if (jsonMode) {
    config.responseMimeType = "application/json";
    if (geminiSchema) config.responseSchema = geminiSchema;
  }
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: { role: "user", parts: [{ text: prompt }] },
    ...(jsonMode ? { config } : {}),
  });
  return getResponseText(response).trim();
}

export const useGemini = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTaskSuggestions = useCallback(
    async (taskTitle: string): Promise<string[]> => {
      setIsLoading(true);
      setError(null);
      try {
        const jsonText = await callAI(
          `Break down this complex task into 3-5 simple, actionable sub-tasks. The user wants to add these to their to-do list. Task: "${taskTitle}". Return a JSON object with a "subTasks" array of strings.`,
          true,
          "gemini-2.5-flash",
          {
            type: Type.OBJECT,
            properties: {
              subTasks: {
                type: Type.ARRAY,
                description: "A list of simple, actionable sub-task titles.",
                items: { type: Type.STRING },
              },
            },
            required: ["subTasks"],
          },
        );
        const result = JSON.parse(jsonText);
        if (result && Array.isArray(result.subTasks)) {
          return result.subTasks;
        }
        return [];
      } catch (e) {
        console.error("Error fetching task suggestions:", e);
        setError("Failed to get suggestions. Please try again.");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getMotivation = useCallback(
    async (
      taskTitle: string,
      suggestionType: SuggestionType,
      mood?: MoodLevel,
    ): Promise<string> => {
      const reasonMap = {
        deep_work:
          "This looks like a great task for deep focus when your energy is high.",
        low_energy:
          "This seems like a good, low-effort task to keep the momentum going.",
        wrap_up:
          "This is a quick task to help you wrap up your day successfully.",
        habit: "It's a good time to work on your habits.",
        planning: "A great next step is to plan what's next.",
      };
      const moodContext = mood ? ` The user is currently feeling ${mood}.` : "";

      setIsLoading(true);
      setError(null);
      try {
        const text = await callAI(
          `Generate a short, one-sentence motivational phrase for starting the task "${taskTitle}". The reason for suggesting it is: ${reasonMap[suggestionType]}.${moodContext} Keep it encouraging, concise, and positive. Adapt tone to the user's mood if provided.`,
          false,
          "gemini-2.5-flash",
        );
        return text.trim() || "You've got this! Let's start.";
      } catch (e) {
        console.error("Error fetching motivation:", e);
        return "You've got this! Let's start.";
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // NEW: Parse natural language into a structured task
  const parseNaturalLanguageTask = useCallback(
    async (input: string): Promise<ParsedTaskFromNL | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const jsonText = await callAI(
          `Parse this natural language input into a structured task. Input: "${input}"
                
Extract:
- title: A clean task title
- duration: Estimated minutes (default 30 if unclear)
- type: "Task" or "Habit" (use Habit if it's recurring/daily)
- suggestedTime: Best time in "HH:mm" format based on task nature (morning for exercise, afternoon for meetings, etc.)
- matrixQuadrant: "do" (urgent+important), "schedule" (important not urgent), "delegate" (urgent not important), or "delete" (neither)

Return a JSON object with fields: title, duration, type, suggestedTime, matrixQuadrant.`,
          true,
          "gemini-2.5-flash",
          {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              duration: { type: Type.NUMBER },
              type: { type: Type.STRING },
              suggestedTime: { type: Type.STRING },
              matrixQuadrant: { type: Type.STRING },
            },
            required: ["title", "duration", "type"],
          },
        );
        const result = JSON.parse(jsonText);
        return result as ParsedTaskFromNL;
      } catch (e) {
        console.error("Error parsing natural language task:", e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // NEW: Analyze and categorize inbox item
  const analyzeInboxItem = useCallback(
    async (
      item: SavedItem,
    ): Promise<{
      category: string;
      priority: "high" | "medium" | "low";
      summary: string;
      suggestedAction: string;
    } | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const jsonText = await callAI(
          `Analyze this saved item for a productivity app:
Title: "${item.title}"
URL: "${item.url || "N/A"}"
Source: "${item.source}"
Duration: ${item.duration || "unknown"} minutes

Provide a JSON object with:
- category: A short topic category (e.g., "Learning", "Entertainment", "Work", "Health", "Finance")
- priority: "high", "medium", or "low" based on typical value/urgency
- summary: A one-sentence summary of what this content likely contains
- suggestedAction: What the user should do with this (e.g., "Watch this weekend", "Read during commute", "Schedule 30 min to review")`,
          true,
          "gemini-2.0-flash",
          {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              priority: { type: Type.STRING },
              summary: { type: Type.STRING },
              suggestedAction: { type: Type.STRING },
            },
            required: ["category", "priority", "summary", "suggestedAction"],
          },
        );
        console.log("AI Response:", jsonText);
        return JSON.parse(jsonText);
      } catch (e) {
        console.error("Error analyzing inbox item:", e);
        setError("Failed to analyze item. Please try again.");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );
  // NEW: Generate daily summary with AI insights
  const generateDailySummary = useCallback(
    async (tasks: Task[], date: string): Promise<DailySummary | null> => {
      const completedTasks = tasks.filter(
        (t) => t.completed && t.type === "Task",
      );
      const completedHabits = tasks.filter(
        (t) => t.completed && t.type === "Habit",
      );
      const allTasks = tasks.filter((t) => t.type === "Task");
      const allHabits = tasks.filter((t) => t.type === "Habit");
      const focusMinutes = completedTasks.reduce(
        (sum, t) => sum + t.duration,
        0,
      );
      setIsLoading(true);

      try {
        const aiResult = JSON.parse(
          await callAI(
            `Generate an encouraging daily summary for a productivity app user.

Today's stats:
- Tasks completed: ${completedTasks.length}/${allTasks.length}
- Habits completed: ${completedHabits.length}/${allHabits.length}
- Focus time: ${focusMinutes} minutes
- Completed task titles: ${completedTasks.map((t) => t.title).join(", ") || "None"}

Return a JSON object with:
- aiInsight: A personalized observation about their productivity patterns (1-2 sentences)
- topAccomplishment: Highlight their best achievement today
- suggestionForTomorrow: One actionable tip for tomorrow`,
            true,
            "gemini-2.5-flash",
            {
              type: Type.OBJECT,
              properties: {
                aiInsight: { type: Type.STRING },
                topAccomplishment: { type: Type.STRING },
                suggestionForTomorrow: { type: Type.STRING },
              },
              required: [
                "aiInsight",
                "topAccomplishment",
                "suggestionForTomorrow",
              ],
            },
          ),
        );

        return {
          date,
          tasksCompleted: completedTasks.length,
          totalTasks: allTasks.length,
          focusMinutes,
          habitsCompleted: completedHabits.length,
          totalHabits: allHabits.length,
          aiInsight: aiResult.aiInsight,
          topAccomplishment: aiResult.topAccomplishment,
          suggestionForTomorrow: aiResult.suggestionForTomorrow,
        };
      } catch (e: any) {
        console.error("Error generating daily summary:", e);
        const errorMessage = e?.message || e?.toString() || "Unknown error";
        setError(`AI Summary failed: ${errorMessage}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // NEW: Get mood-adjusted task suggestion
  const getMoodBasedSuggestion = useCallback(
    async (
      tasks: Task[],
      mood: MoodLevel,
    ): Promise<{ task: Task; reason: string } | null> => {
      if (tasks.length === 0) return null;
      const incompleteTasks = tasks.filter((t) => !t.completed);
      if (incompleteTasks.length === 0) return null;

      setIsLoading(true);
      try {
        const taskList = incompleteTasks.map((t) => ({
          id: t.id,
          title: t.title,
          duration: t.duration,
          type: t.type,
        }));

        const result = JSON.parse(
          await callAI(
            `The user is feeling "${mood}". From these tasks, pick the BEST one to suggest right now:

${JSON.stringify(taskList, null, 2)}

Mood guidelines:
- energized: Suggest longer, challenging tasks
- focused: Suggest deep work or important tasks
- tired: Suggest short, easy tasks or skip suggesting
- stressed: Suggest calming habits or quick wins
- neutral: Balance based on time of day

Return a JSON object with taskId and a mood-appropriate motivational reason.`,
            true,
            "gemini-2.5-flash",
            {
              type: Type.OBJECT,
              properties: {
                taskId: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ["taskId", "reason"],
            },
          ),
        );

        const selectedTask = incompleteTasks.find(
          (t) => t.id === result.taskId,
        );
        return selectedTask
          ? { task: selectedTask, reason: result.reason }
          : null;
      } catch (e) {
        console.error("Error getting mood-based suggestion:", e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // NEW: Estimate task duration based on title
  const estimateTaskDuration = useCallback(
    async (taskTitle: string): Promise<number> => {
      try {
        const result = JSON.parse(
          await callAI(
            `Estimate how many minutes this task would typically take: "${taskTitle}"
                
Consider:
- Simple tasks (reply to email, make a call): 5-15 min
- Medium tasks (write a document, exercise): 20-45 min
- Complex tasks (research, creative work): 60-120 min

Return a JSON object with a "minutes" field containing only the number.`,
            true,
            "gemini-2.5-flash",
            {
              type: Type.OBJECT,
              properties: { minutes: { type: Type.NUMBER } },
              required: ["minutes"],
            },
          ),
        );
        return result.minutes || 30;
      } catch (e) {
        console.error("Error estimating duration:", e);
        return 30;
      }
    },
    [],
  );

  const parseVoiceTask = useCallback(
    async (transcript: string): Promise<VoiceParsedTask | null> => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const result = JSON.parse(
          await callAI(
            `Parse this voice command into a task. Today is ${today}.
Voice input: "${transcript}"

Extract:
- title: the task name
- date: YYYY-MM-DD (default today if not mentioned)
- time: HH:MM in 24h format (if mentioned)
- duration: estimated minutes (default 30)
- type: one of "work", "personal", "health", "errand"

Return a JSON object with these fields. If time is not mentioned, omit it.`,
            true,
            "gemini-2.5-flash",
            {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                date: { type: Type.STRING },
                time: { type: Type.STRING },
                duration: { type: Type.NUMBER },
                type: { type: Type.STRING },
              },
              required: ["title"],
            },
          ),
        );
        return result as VoiceParsedTask;
      } catch (e) {
        console.error("Error parsing voice task:", e);
        return null;
      }
    },
    [],
  );

  const generateSmartNotificationMessage = useCallback(
    async (task: Task, context: string): Promise<string> => {
      try {
        const result = await callAI(
          `Generate a short, motivating notification message for this task reminder.
Task: "${task.title}"
Context: ${context}
Time: ${new Date().toLocaleTimeString()}

Keep it under 60 characters, friendly and action-oriented. Return just the message text, no quotes.`,
          false,
        );
        return result.trim() || `Time to work on: ${task.title}`;
      } catch (e) {
        return `Time to work on: ${task.title}`;
      }
    },
    [],
  );

  return {
    getTaskSuggestions,
    getMotivation,
    parseNaturalLanguageTask,
    analyzeInboxItem,
    generateDailySummary,
    getMoodBasedSuggestion,
    estimateTaskDuration,
    parseVoiceTask,
    generateSmartNotificationMessage,
    isLoading,
    error,
  };
};
