import { useState, useCallback } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import {
  SuggestionType,
  MoodLevel,
  Task,
  SavedItem,
  DailySummary,
  ParsedTaskFromNL,
} from "../types.ts";

// Ensure the API key is available as an environment variable
const API_KEY = (import.meta as any).env?.VITE_API_KEY || "";

// Helper to safely get response text
const getResponseText = (response: any): string => {
  try {
    return response?.text || "";
  } catch (e) {
    console.error("Error getting response text:", e);
    return "";
  }
};

export const useGemini = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get AI instance with error handling
  const getAI = () => {
    if (!API_KEY) {
      console.warn("API key not configured");
      return null;
    }
    try {
      return new GoogleGenAI({ apiKey: API_KEY });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI:", e);
      return null;
    }
  };

  const getTaskSuggestions = useCallback(
    async (taskTitle: string): Promise<string[]> => {
      if (!API_KEY) {
        console.warn("API key is not configured - returning empty suggestions");
        return [];
      }

      const ai = getAI();
      if (!ai) {
        console.warn("Failed to initialize AI - returning empty suggestions");
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            role: "user",
            parts: [
              {
                text: `Break down this complex task into 3-5 simple, actionable sub-tasks. The user wants to add these to their to-do list. Task: "${taskTitle}"`,
              },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                subTasks: {
                  type: Type.ARRAY,
                  description: "A list of simple, actionable sub-task titles.",
                  items: {
                    type: Type.STRING,
                  },
                },
              },
              required: ["subTasks"],
            },
          },
        });

        const jsonText = getResponseText(response).trim();
        const result = JSON.parse(jsonText);

        if (result && Array.isArray(result.subTasks)) {
          return result.subTasks;
        }
        return [];
      } catch (e) {
        console.error("Error fetching task suggestions from Gemini API:", e);
        setError("Failed to get suggestions. Please try again.");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getMotivation = useCallback(
    async (
      taskTitle: string,
      suggestionType: SuggestionType,
      mood?: MoodLevel
    ): Promise<string> => {
      if (!API_KEY) {
        return "Let's get this done!";
      }

      const ai = getAI();
      if (!ai) {
        return "Let's get this done!";
      }

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
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            role: "user",
            parts: [
              {
                text: `Generate a short, one-sentence motivational phrase for starting the task "${taskTitle}". The reason for suggesting it is: ${reasonMap[suggestionType]}.${moodContext} Keep it encouraging, concise, and positive. Adapt tone to the user's mood if provided.`,
              },
            ],
          },
        });
        return getResponseText(response).trim();
      } catch (e) {
        console.error("Error fetching motivation from Gemini API:", e);
        return "You've got this! Let's start.";
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // NEW: Parse natural language into a structured task
  const parseNaturalLanguageTask = useCallback(
    async (input: string): Promise<ParsedTaskFromNL | null> => {
      if (!API_KEY) return null;

      const ai = getAI();
      setIsLoading(true);
      setError(null);

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            role: "user",
            parts: [
              {
                text: `Parse this natural language input into a structured task. Input: "${input}"
                
Extract:
- title: A clean task title
- duration: Estimated minutes (default 30 if unclear)
- type: "Task" or "Habit" (use Habit if it's recurring/daily)
- suggestedTime: Best time in "HH:mm" format based on task nature (morning for exercise, afternoon for meetings, etc.)
- matrixQuadrant: "do" (urgent+important), "schedule" (important not urgent), "delegate" (urgent not important), or "delete" (neither)`,
              },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
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
          },
        });

        const result = JSON.parse(getResponseText(response).trim());
        return result as ParsedTaskFromNL;
      } catch (e) {
        console.error("Error parsing natural language task:", e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // NEW: Analyze and categorize inbox item
  const analyzeInboxItem = useCallback(
    async (
      item: SavedItem
    ): Promise<{
      category: string;
      priority: "high" | "medium" | "low";
      summary: string;
      suggestedAction: string;
    } | null> => {
      if (!API_KEY) {
        console.error("API key is not configured for analyzeInboxItem");
        setError("API key is not configured.");
        return null;
      }

      const ai = getAI();
      setIsLoading(true);
      setError(null);

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: {
            role: "user",
            parts: [
              {
                text: `Analyze this saved item for a productivity app:
Title: "${item.title}"
URL: "${item.url || "N/A"}"
Source: "${item.source}"
Duration: ${item.duration || "unknown"} minutes

Provide:
- category: A short topic category (e.g., "Learning", "Entertainment", "Work", "Health", "Finance")
- priority: "high", "medium", or "low" based on typical value/urgency
- summary: A one-sentence summary of what this content likely contains
- suggestedAction: What the user should do with this (e.g., "Watch this weekend", "Read during commute", "Schedule 30 min to review")`,
              },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                priority: { type: Type.STRING },
                summary: { type: Type.STRING },
                suggestedAction: { type: Type.STRING },
              },
              required: ["category", "priority", "summary", "suggestedAction"],
            },
          },
        });

        const responseText = getResponseText(response).trim();
        console.log("AI Response:", responseText);
        return JSON.parse(responseText);
      } catch (e) {
        console.error("Error analyzing inbox item:", e);
        setError("Failed to analyze item. Please try again.");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // NEW: Generate daily summary with AI insights
  const generateDailySummary = useCallback(
    async (tasks: Task[], date: string): Promise<DailySummary | null> => {
      if (!API_KEY) return null;

      const completedTasks = tasks.filter(
        (t) => t.completed && t.type === "Task"
      );
      const completedHabits = tasks.filter(
        (t) => t.completed && t.type === "Habit"
      );
      const allTasks = tasks.filter((t) => t.type === "Task");
      const allHabits = tasks.filter((t) => t.type === "Habit");
      const focusMinutes = completedTasks.reduce(
        (sum, t) => sum + t.duration,
        0
      );

      const ai = getAI();
      setIsLoading(true);

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            role: "user",
            parts: [
              {
                text: `Generate an encouraging daily summary for a productivity app user.

Today's stats:
- Tasks completed: ${completedTasks.length}/${allTasks.length}
- Habits completed: ${completedHabits.length}/${allHabits.length}
- Focus time: ${focusMinutes} minutes
- Completed task titles: ${
                  completedTasks.map((t) => t.title).join(", ") || "None"
                }

Provide:
- aiInsight: A personalized observation about their productivity patterns (1-2 sentences)
- topAccomplishment: Highlight their best achievement today
- suggestionForTomorrow: One actionable tip for tomorrow`,
              },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
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
          },
        });

        const aiResult = JSON.parse(getResponseText(response).trim());

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
    []
  );

  // NEW: Get mood-adjusted task suggestion
  const getMoodBasedSuggestion = useCallback(
    async (
      tasks: Task[],
      mood: MoodLevel
    ): Promise<{ task: Task; reason: string } | null> => {
      if (!API_KEY || tasks.length === 0) return null;

      const incompleteTasks = tasks.filter((t) => !t.completed);
      if (incompleteTasks.length === 0) return null;

      const ai = getAI();
      setIsLoading(true);

      try {
        const taskList = incompleteTasks.map((t) => ({
          id: t.id,
          title: t.title,
          duration: t.duration,
          type: t.type,
        }));

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            role: "user",
            parts: [
              {
                text: `The user is feeling "${mood}". From these tasks, pick the BEST one to suggest right now:

${JSON.stringify(taskList, null, 2)}

Mood guidelines:
- energized: Suggest longer, challenging tasks
- focused: Suggest deep work or important tasks
- tired: Suggest short, easy tasks or skip suggesting
- stressed: Suggest calming habits or quick wins
- neutral: Balance based on time of day

Return the task ID and a mood-appropriate motivational reason.`,
              },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                taskId: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ["taskId", "reason"],
            },
          },
        });

        const result = JSON.parse(getResponseText(response).trim());
        const selectedTask = incompleteTasks.find(
          (t) => t.id === result.taskId
        );

        if (selectedTask) {
          return { task: selectedTask, reason: result.reason };
        }
        return null;
      } catch (e) {
        console.error("Error getting mood-based suggestion:", e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // NEW: Estimate task duration based on title
  const estimateTaskDuration = useCallback(
    async (taskTitle: string): Promise<number> => {
      if (!API_KEY) return 30; // Default

      const ai = getAI();

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            role: "user",
            parts: [
              {
                text: `Estimate how many minutes this task would typically take: "${taskTitle}"
                
Consider:
- Simple tasks (reply to email, make a call): 5-15 min
- Medium tasks (write a document, exercise): 20-45 min
- Complex tasks (research, creative work): 60-120 min

Return only a number in minutes.`,
              },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                minutes: { type: Type.NUMBER },
              },
              required: ["minutes"],
            },
          },
        });

        const result = JSON.parse(getResponseText(response).trim());
        return result.minutes || 30;
      } catch (e) {
        console.error("Error estimating duration:", e);
        return 30;
      }
    },
    []
  );

  return {
    getTaskSuggestions,
    getMotivation,
    parseNaturalLanguageTask,
    analyzeInboxItem,
    generateDailySummary,
    getMoodBasedSuggestion,
    estimateTaskDuration,
    isLoading,
    error,
  };
};
