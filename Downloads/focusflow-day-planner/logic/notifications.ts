import {
  LocalNotifications,
  ScheduleOptions,
} from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

let notificationTimeoutIds: number[] = [];
let notificationIdCounter = 1;

// Check if running on native platform
const isNative = () => Capacitor.isNativePlatform();

export const requestNotificationPermission = async (): Promise<
  "granted" | "denied" | "default"
> => {
  if (isNative()) {
    // Native: Use Capacitor Local Notifications
    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted" ? "granted" : "denied";
  } else {
    // Web: Use browser notifications
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
      return "denied";
    }
    const permission = await Notification.requestPermission();
    return permission;
  }
};

export const checkNotificationPermission = async (): Promise<boolean> => {
  if (isNative()) {
    const result = await LocalNotifications.checkPermissions();
    return result.display === "granted";
  } else {
    return Notification.permission === "granted";
  }
};

export const scheduleNotification = async (
  title: string,
  options: { body?: string; tag?: string },
  timestamp: number
): Promise<number | null> => {
  const delay = timestamp - Date.now();
  if (delay < 0) return null;

  if (isNative()) {
    // Native: Use Capacitor Local Notifications
    const id = notificationIdCounter++;
    const scheduleOptions: ScheduleOptions = {
      notifications: [
        {
          id,
          title,
          body: options.body || "",
          schedule: { at: new Date(timestamp) },
          sound: "default",
          smallIcon: "ic_launcher_foreground",
          largeIcon: "ic_launcher",
          channelId: "focusflow-tasks",
        },
      ],
    };

    await LocalNotifications.schedule(scheduleOptions);
    return id;
  } else {
    // Web: Use browser notifications with timeout
    const timeoutId = window.setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification(title, options);
      }
    }, delay);

    notificationTimeoutIds.push(timeoutId);
    return timeoutId;
  }
};

export const scheduleTaskReminder = async (
  taskId: string,
  taskTitle: string,
  scheduledTime: Date,
  reminderMinutesBefore: number = 15
): Promise<number | null> => {
  const reminderTime = new Date(
    scheduledTime.getTime() - reminderMinutesBefore * 60 * 1000
  );

  return scheduleNotification(
    "⏰ Task Reminder",
    {
      body: `"${taskTitle}" starts in ${reminderMinutesBefore} minutes`,
      tag: `task-${taskId}`,
    },
    reminderTime.getTime()
  );
};

export const scheduleFocusEndNotification = async (
  taskTitle: string,
  endTime: Date
): Promise<number | null> => {
  return scheduleNotification(
    "🎯 Focus Session Complete!",
    {
      body: `Great work on "${taskTitle}"! Time for a break.`,
      tag: "focus-end",
    },
    endTime.getTime()
  );
};

export const scheduleHabitReminder = async (
  habitName: string,
  reminderTime: Date
): Promise<number | null> => {
  return scheduleNotification(
    "✅ Habit Reminder",
    {
      body: `Don't forget: ${habitName}`,
      tag: `habit-${habitName}`,
    },
    reminderTime.getTime()
  );
};

export const cancelNotification = async (
  notificationId: number
): Promise<void> => {
  if (isNative()) {
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }],
    });
  } else {
    clearTimeout(notificationId);
    notificationTimeoutIds = notificationTimeoutIds.filter(
      (id) => id !== notificationId
    );
  }
};

export const cancelAllNotifications = async (): Promise<void> => {
  if (isNative()) {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } else {
    notificationTimeoutIds.forEach((id) => clearTimeout(id));
    notificationTimeoutIds = [];
  }
};

export const getPendingNotifications = async () => {
  if (isNative()) {
    return await LocalNotifications.getPending();
  }
  return { notifications: [] };
};

// Initialize notification channel for Android
export const initializeNotifications = async (): Promise<void> => {
  if (isNative() && Capacitor.getPlatform() === "android") {
    await LocalNotifications.createChannel({
      id: "focusflow-tasks",
      name: "Task Reminders",
      description: "Notifications for task reminders and focus sessions",
      importance: 4, // High importance
      visibility: 1, // Public
      sound: "default",
      vibration: true,
    });
  }
};
