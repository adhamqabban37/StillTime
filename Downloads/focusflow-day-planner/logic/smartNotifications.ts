import {
  LocalNotifications,
  ActionPerformed,
} from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { Task } from "../types.ts";
import { scheduleNotification } from "./notifications.ts";

const isNative = () => Capacitor.isNativePlatform();

// Action type IDs for notification buttons
const SMART_ACTION_TYPE = "SMART_TASK_REMINDER";

/**
 * Register action types for smart notifications with interactive buttons.
 * Call once during app initialization.
 */
export async function registerSmartNotificationActions(): Promise<void> {
  if (!isNative()) return;

  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: SMART_ACTION_TYPE,
        actions: [
          {
            id: "focus",
            title: "Start Focus",
          },
          {
            id: "snooze",
            title: "Snooze 10 min",
          },
          {
            id: "complete",
            title: "Mark Complete",
            destructive: false,
          },
        ],
      },
    ],
  });
}

/**
 * Schedule a smart notification for a task with contextual AI message.
 * On native: Uses Capacitor with action buttons.
 * On web: Falls back to standard notification.
 */
export async function scheduleSmartNotification(
  task: Task,
  contextMessage: string,
  timestamp: number
): Promise<number | null> {
  const delay = timestamp - Date.now();
  if (delay < 0) return null;

  if (isNative()) {
    const id = Math.abs(
      task.id.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0)
    );

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: `🧠 ${task.title}`,
          body: contextMessage,
          schedule: { at: new Date(timestamp) },
          sound: "default",
          smallIcon: "ic_launcher_foreground",
          largeIcon: "ic_launcher",
          channelId: "focusflow-smart",
          actionTypeId: SMART_ACTION_TYPE,
          extra: { taskId: task.id },
        },
      ],
    });

    return id;
  } else {
    // Web fallback: standard notification
    return scheduleNotification(
      `🧠 ${task.title}`,
      { body: contextMessage, tag: `smart-${task.id}` },
      timestamp
    );
  }
}

/**
 * Initialize the smart notification channel (Android only).
 */
export async function initSmartNotificationChannel(): Promise<void> {
  if (!isNative() || Capacitor.getPlatform() !== "android") return;

  await LocalNotifications.createChannel({
    id: "focusflow-smart",
    name: "Smart Reminders",
    description: "AI-powered contextual task reminders with action buttons",
    importance: 4,
    visibility: 1,
    sound: "default",
    vibration: true,
  });
}

/**
 * Listen for smart notification action responses.
 * Returns a cleanup function.
 */
export function listenForSmartNotificationActions(
  onFocus: (taskId: string) => void,
  onSnooze: (taskId: string) => void,
  onComplete: (taskId: string) => void
): (() => void) | undefined {
  if (!isNative()) return undefined;

  const listener = LocalNotifications.addListener(
    "localNotificationActionPerformed",
    (action: ActionPerformed) => {
      const taskId = action.notification.extra?.taskId;
      if (!taskId) return;

      switch (action.actionId) {
        case "focus":
          onFocus(taskId);
          break;
        case "snooze":
          onSnooze(taskId);
          break;
        case "complete":
          onComplete(taskId);
          break;
      }
    }
  );

  return () => {
    listener.then((l) => l.remove());
  };
}
