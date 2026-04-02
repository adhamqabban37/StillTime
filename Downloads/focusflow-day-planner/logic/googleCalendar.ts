import { CalendarEvent } from "../types.ts";

const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "";
const SCOPES =
  "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

let tokenClient: any = null;
let gapiInitialized = false;
let gisInitialized = false;
let accessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Load the Google API (gapi) and GIS scripts.
 * Safe to call multiple times; only loads once.
 */
export async function loadGoogleScripts(): Promise<void> {
  // Load GAPI
  if (!gapiInitialized) {
    await new Promise<void>((resolve, reject) => {
      if ((window as any).gapi) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google API"));
      document.head.appendChild(script);
    });

    await new Promise<void>((resolve) => {
      (window as any).gapi.load("client", async () => {
        await (window as any).gapi.client.init({});
        await (window as any).gapi.client.load(DISCOVERY_DOC);
        gapiInitialized = true;
        resolve();
      });
    });
  }

  // Load GIS (Google Identity Services)
  if (!gisInitialized) {
    await new Promise<void>((resolve, reject) => {
      if ((window as any).google?.accounts?.oauth2) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load Google Identity Services"));
      document.head.appendChild(script);
    });
    gisInitialized = true;
  }
}

/**
 * Initiate Google Sign-In and get an access token.
 * Returns true on success.
 */
export function signInWithGoogle(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!GOOGLE_CLIENT_ID) {
      console.error("VITE_GOOGLE_CLIENT_ID not set");
      resolve(false);
      return;
    }

    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error) {
          console.error("Google OAuth error:", response);
          resolve(false);
          return;
        }
        accessToken = response.access_token;
        tokenExpiresAt = Date.now() + (response.expires_in || 3600) * 1000;
        resolve(true);
      },
    });

    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

/**
 * Revoke access and sign out.
 */
export function signOutGoogle(): void {
  if (accessToken) {
    (window as any).google.accounts.oauth2.revoke(accessToken);
    accessToken = null;
    tokenExpiresAt = 0;
  }
}

/**
 * Check if currently signed in.
 */
export function isGoogleSignedIn(): boolean {
  return !!accessToken && Date.now() < tokenExpiresAt;
}

/**
 * Fetch today's calendar events from Google Calendar.
 */
export async function fetchTodayEvents(): Promise<CalendarEvent[]> {
  if (!isGoogleSignedIn() || !gapiInitialized) return [];

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  try {
    const response = await (window as any).gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      showDeleted: false,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.result.items || [];
    return events.map((event: any) => mapGoogleEvent(event)).filter(Boolean);
  } catch (e) {
    console.error("Failed to fetch calendar events:", e);
    return [];
  }
}

/**
 * Export a FocusFlow task as a Google Calendar event.
 */
export async function exportTaskToGoogleCalendar(
  title: string,
  date: string, // YYYY-MM-DD
  startTime: string, // HH:mm
  durationMinutes: number,
): Promise<boolean> {
  if (!isGoogleSignedIn() || !gapiInitialized) return false;

  const [hours, minutes] = startTime.split(":").map(Number);
  const start = new Date(`${date}T00:00:00`);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  try {
    await (window as any).gapi.client.calendar.events.insert({
      calendarId: "primary",
      resource: {
        summary: title,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      },
    });
    return true;
  } catch (e) {
    console.error("Failed to export task to Google Calendar:", e);
    return false;
  }
}

function mapGoogleEvent(event: any): CalendarEvent | null {
  const isAllDay = !event.start?.dateTime;
  const startStr = event.start?.dateTime || event.start?.date;
  const endStr = event.end?.dateTime || event.end?.date;

  if (!startStr || !endStr) return null;

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  const startTime = isAllDay
    ? "00:00"
    : `${startDate.getHours().toString().padStart(2, "0")}:${startDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

  const endTime = isAllDay
    ? "00:00"
    : `${endDate.getHours().toString().padStart(2, "0")}:${endDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

  return {
    id: event.id,
    title: event.summary || "(No title)",
    start: startStr,
    end: endStr,
    startTime,
    endTime,
    duration: isAllDay ? 0 : durationMinutes,
    isAllDay,
    source: "google",
  };
}
