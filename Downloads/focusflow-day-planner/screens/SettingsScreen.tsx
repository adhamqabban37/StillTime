import React, { useState, useEffect, useContext, useCallback } from "react";
import { NotificationManager, Reminder } from "../logic/notificationManager";
import { WidgetBridge } from "../logic/widgetBridge";
import { AppContext } from "../context/AppContext.tsx";
import {
  loadGoogleScripts,
  signInWithGoogle,
  signOutGoogle,
  fetchTodayEvents,
} from "../logic/googleCalendar.ts";

export default function SettingsScreen() {
  const { state, dispatch } = useContext(AppContext);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [newRepeat, setNewRepeat] = useState<"none" | "daily" | "weekly">(
    "none",
  );
  const [calSyncing, setCalSyncing] = useState(false);

  useEffect(() => {
    loadGoogleScripts().catch(() => {});
  }, []);

  const handleGoogleConnect = useCallback(async () => {
    try {
      await signInWithGoogle();
      dispatch({ type: "SET_GOOGLE_CALENDAR_CONNECTED", payload: true });
      const events = await fetchTodayEvents();
      dispatch({ type: "SET_CALENDAR_EVENTS", payload: events });
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: `Synced ${events.length} calendar events` },
      });
    } catch (e) {
      console.error("Google Calendar connect failed:", e);
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: "Failed to connect Google Calendar" },
      });
    }
  }, [dispatch]);

  const handleGoogleDisconnect = useCallback(() => {
    signOutGoogle();
    dispatch({ type: "SET_GOOGLE_CALENDAR_CONNECTED", payload: false });
    dispatch({ type: "SET_CALENDAR_EVENTS", payload: [] });
    dispatch({
      type: "SHOW_TOAST",
      payload: { message: "Google Calendar disconnected" },
    });
  }, [dispatch]);

  const handleForceSync = useCallback(async () => {
    if (!state.googleCalendarConnected) return;
    setCalSyncing(true);
    try {
      const events = await fetchTodayEvents();
      dispatch({ type: "SET_CALENDAR_EVENTS", payload: events });
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: `Synced ${events.length} events` },
      });
    } catch (e) {
      dispatch({ type: "SHOW_TOAST", payload: { message: "Sync failed" } });
    } finally {
      setCalSyncing(false);
    }
  }, [state.googleCalendarConnected, dispatch]);

  const addReminder = async () => {
    const hasPerms = await NotificationManager.requestPermissions();
    if (!hasPerms) return alert("Notification permissions required");

    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newTitle,
      message: "Time to focus!",
      time: newTime,
      repeat: newRepeat,
    };

    await NotificationManager.scheduleNotification(reminder);
    setReminders([...reminders, reminder]);
    setNewTitle("");
  };

  const deleteReminder = async (id: string) => {
    await NotificationManager.cancelNotification(id);
    setReminders(reminders.filter((r) => r.id !== id));
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Notification Settings</h3>
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Reminder Title"
            className="border p-2 rounded flex-1"
          />
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="border p-2 rounded"
          />
          <select
            value={newRepeat}
            onChange={(e) => setNewRepeat(e.target.value as any)}
            className="border p-2 rounded"
          >
            <option value="none">Once</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <button
            onClick={addReminder}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>

        <ul className="space-y-2">
          {reminders.map((r) => (
            <li
              key={r.id}
              className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-3 rounded"
            >
              <div>
                <strong>{r.title}</strong> at {r.time} ({r.repeat})
              </div>
              <button
                onClick={() => deleteReminder(r.id)}
                className="text-red-500 font-bold"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Widget Settings</h3>
        <p className="text-sm text-gray-500">
          Widgets update automatically in the background. Long-press your
          Android home screen to add the FocusFlow widgets!
        </p>
        <button
          onClick={() => alert("Widget data synced! Check your home screen.")}
          className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded font-medium"
        >
          Force Sync Widget Data Now
        </button>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Google Calendar</h3>
        <p className="text-sm text-gray-500">
          Connect your Google Calendar to see events on the timeline and let
          Autopilot avoid scheduling over them.
        </p>
        {state.googleCalendarConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>Connected</span>
              <span className="text-slate-500">
                · {state.calendarEvents.length} events today
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleForceSync}
                disabled={calSyncing}
                className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded font-medium disabled:opacity-50"
              >
                {calSyncing ? "Syncing..." : "Sync Now"}
              </button>
              <button
                onClick={handleGoogleDisconnect}
                className="bg-red-100 text-red-700 px-4 py-2 rounded font-medium"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleGoogleConnect}
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Connect Google Calendar
          </button>
        )}
      </section>
    </div>
  );
}
