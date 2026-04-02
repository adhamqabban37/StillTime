import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

export interface Reminder {
  id: string;
  title: string;
  message: string;
  time: string; // HH:mm
  repeat: "none" | "daily" | "weekly";
  associatedId?: string; // Task or Habit ID
}

export const NotificationManager = {
  async requestPermissions() {
    if (!Capacitor.isNativePlatform()) return true;
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted";
  },

  async scheduleNotification(reminder: Reminder) {
    if (!Capacitor.isNativePlatform()) return;

    const [hours, minutes] = reminder.time.split(":").map(Number);

    let schedule: any = {};
    const now = new Date();
    const scheduleTime = new Date();
    scheduleTime.setHours(hours, minutes, 0, 0);

    // If time has passed today and no repeat, schedule for tomorrow
    if (scheduleTime <= now && reminder.repeat === "none") {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
      schedule = { at: scheduleTime };
    } else if (reminder.repeat === "daily") {
      schedule = { on: { hour: hours, minute: minutes } };
    } else if (reminder.repeat === "weekly") {
      schedule = {
        on: { weekday: now.getDay(), hour: hours, minute: minutes },
      };
    } else {
      schedule = { at: scheduleTime };
    }

    // Convert string ID to an integer for Android Notification ID
    const notificationId = Math.abs(
      reminder.id.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0),
    );

    await LocalNotifications.schedule({
      notifications: [
        {
          title: reminder.title,
          body: reminder.message,
          id: notificationId,
          schedule: schedule,
          sound: undefined,
          attachments: undefined,
          actionTypeId: "",
          extra: null,
        },
      ],
    });
  },

  async cancelNotification(reminderId: string) {
    if (!Capacitor.isNativePlatform()) return;
    const notificationId = Math.abs(
      reminderId.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0),
    );

    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }],
    });
  },

  async clearAll() {
    if (!Capacitor.isNativePlatform()) return;
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }
  },
};
