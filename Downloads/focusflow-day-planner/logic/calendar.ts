import { Capacitor } from "@capacitor/core";
import { Task } from "../types";

// Check if running on native platform
const isNative = () => Capacitor.isNativePlatform();

interface CalendarEvent {
  title: string;
  location?: string;
  notes?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
}

// Add task to device calendar using native intent
export const addTaskToCalendar = async (task: Task): Promise<boolean> => {
  // Parse startTime (HH:mm format) into a Date
  const today = new Date();
  const [hours, minutes] = task.startTime.split(":").map(Number);
  const startTime = new Date(today);
  startTime.setHours(hours, minutes, 0, 0);

  const endTime = new Date(
    startTime.getTime() + (task.duration || 30) * 60 * 1000
  );

  const event: CalendarEvent = {
    title: task.title,
    notes: `Type: ${task.type}${
      task.matrixQuadrant ? `\nQuadrant: ${task.matrixQuadrant}` : ""
    }`,
    startDate: startTime,
    endDate: endTime,
    allDay: false,
  };

  return addToCalendar(event);
};

export const addToCalendar = async (event: CalendarEvent): Promise<boolean> => {
  if (isNative()) {
    // On Android, we can open the calendar app with pre-filled data using an intent
    // This works without requiring additional plugins
    try {
      const startMs = event.startDate.getTime();
      const endMs = event.endDate.getTime();

      // Create a calendar intent URL
      const calendarUrl = `content://com.android.calendar/events`;

      // For Android, we'll use a workaround by opening a calendar URL
      // This will prompt user to add to their calendar
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        event.title
      )}&dates=${formatDateForGoogle(event.startDate)}/${formatDateForGoogle(
        event.endDate
      )}&details=${encodeURIComponent(
        event.notes || ""
      )}&location=${encodeURIComponent(event.location || "")}`;

      window.open(googleCalendarUrl, "_system");
      return true;
    } catch (error) {
      console.error("Error adding to calendar:", error);
      return false;
    }
  } else {
    // Web: Generate ICS file or open Google Calendar
    return addToCalendarWeb(event);
  }
};

// Format date for Google Calendar URL
const formatDateForGoogle = (date: Date): string => {
  return (
    date
      .toISOString()
      .replace(/-|:|\.\d{3}/g, "")
      .slice(0, 15) + "Z"
  );
};

// Web fallback - generate downloadable ICS file
const addToCalendarWeb = (event: CalendarEvent): boolean => {
  try {
    const icsContent = generateICS(event);
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error generating calendar file:", error);
    return false;
  }
};

// Generate ICS file content
const generateICS = (event: CalendarEvent): string => {
  const formatDate = (date: Date): string => {
    return (
      date
        .toISOString()
        .replace(/-|:|\.\d{3}/g, "")
        .slice(0, 15) + "Z"
    );
  };

  const uid = `${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}@focusflow`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FocusFlow//Day Planner//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(event.endDate)}
SUMMARY:${event.title}
DESCRIPTION:${(event.notes || "").replace(/\n/g, "\\n")}
LOCATION:${event.location || ""}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
};

// Open calendar app (Android)
export const openCalendarApp = (): void => {
  if (isNative()) {
    // Open default calendar app
    window.open("content://com.android.calendar/time/", "_system");
  } else {
    // Web: Open Google Calendar
    window.open("https://calendar.google.com", "_blank");
  }
};

// Export all tasks for a day to calendar
export const exportDayToCalendar = async (
  tasks: Task[],
  date: Date
): Promise<boolean> => {
  const scheduledTasks = tasks.filter((t) => t.startTime);

  if (scheduledTasks.length === 0) {
    return false;
  }

  // Create combined ICS for all tasks
  const events: CalendarEvent[] = scheduledTasks.map((task) => {
    const [hours, minutes] = task.startTime.split(":").map(Number);
    const startDate = new Date(date);
    startDate.setHours(hours, minutes, 0, 0);

    return {
      title: task.title,
      notes: `Type: ${task.type}${
        task.matrixQuadrant ? `\nQuadrant: ${task.matrixQuadrant}` : ""
      }`,
      startDate: startDate,
      endDate: new Date(
        startDate.getTime() + (task.duration || 30) * 60 * 1000
      ),
      allDay: false,
    };
  });

  if (isNative()) {
    // On native, add each event individually
    for (const event of events) {
      await addToCalendar(event);
    }
    return true;
  } else {
    // On web, generate combined ICS
    return exportMultipleEventsICS(events, date);
  }
};

const exportMultipleEventsICS = (
  events: CalendarEvent[],
  date: Date
): boolean => {
  try {
    const formatDate = (d: Date): string => {
      return (
        d
          .toISOString()
          .replace(/-|:|\.\d{3}/g, "")
          .slice(0, 15) + "Z"
      );
    };

    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FocusFlow//Day Planner//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    events.forEach((event, index) => {
      const uid = `${Date.now()}-${index}-${Math.random()
        .toString(36)
        .substr(2, 9)}@focusflow`;
      icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(event.endDate)}
SUMMARY:${event.title}
DESCRIPTION:${(event.notes || "").replace(/\n/g, "\\n")}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
`;
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const dateStr = date.toISOString().split("T")[0];
    const link = document.createElement("a");
    link.href = url;
    link.download = `FocusFlow_Tasks_${dateStr}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error exporting calendar:", error);
    return false;
  }
};
