
# FocusFlow Day Planner

FocusFlow is a progressive web application designed to be a personal productivity OS. It helps users plan their day, manage tasks and habits, process saved content, and stay focused.

## Core Concepts

- **Modes**: The app is built around different modes (Home, Timeline, Habits, Inbox, Review) to provide a focused experience for each activity.
- **Command Center (Home)**: The default view, telling you what you should be doing *right now*.
- **Action-Oriented Inbox**: A "save for later" system that encourages turning saved links into actionable tasks or focus sessions, rather than passive bookmarks.
- **Focus Sessions**: An immersive, timed environment to help you concentrate on a single task.

## Android-First UX Simulation

This web application is designed to *feel* like a native Android application. Here's how we simulate key Android features:

### 1. Android Share Intent

- **Simulation**: A "Save Link" button in the header and a "Quick Save" input on the Home screen mimic the entry point of sharing a link to the app.
- **Behavior**: When a URL is provided, the app parses it, categorizes the source (YouTube, Web, etc.), and saves it to the Inbox, providing immediate feedback.
- **Future Native Implementation**: For a true native app, this would be replaced by an `<intent-filter>` in `AndroidManifest.xml` to register as a share target for `text/plain` content.

### 2. Android Notifications & Alarms

- **Simulation**: The app uses the browser's **Notification API**. Permission is requested on first use.
- **Behavior**: When a task is created or updated, `setTimeout` is used to schedule notifications for 5 minutes before the task and at the task's start time.
- **Limitations**: These notifications are managed by the browser. They will only fire if the browser is running (either with the tab open or in the background). They will not fire if the browser has been completely closed or the device has been restarted.
- **Future Native Implementation**: This would be replaced by Android's `AlarmManager` and `WorkManager` to schedule exact, battery-efficient, and persistent alarms that survive app closure and device reboots.

### 3. Persistent Focus Mode

- **Simulation**: When a focus session starts, its state (the task and end time) is saved to `localStorage`.
- **Behavior**: If the app is closed and reopened, it checks `localStorage`. If a session is still active, the Focus Screen is restored. If the session ended while the app was closed, the task is marked as complete. This simulates the persistence of a native `ForegroundService`.
- **Future Native Implementation**: A `ForegroundService` with a persistent notification would be used to keep the timer running accurately in the background and prevent the OS from killing the process.

### 4. Android Back Button Navigation

- **Simulation**: The app uses the browser's `History API` (`window.history.pushState`).
- **Behavior**: When a modal (like the Action Panel) or the full-screen Focus View is opened, a new state is pushed to the browser's history. Pressing the browser's back button (or the hardware back button on Android) triggers a `popstate` event, which is caught to close the modal gracefully instead of navigating away from the page. This mimics the expected back-button behavior on Android.

### 5. Storage & Persistence

- **Simulation**: The app uses `localStorage` for all data persistence (tasks, habits, saved items).
- **Behavior**: This provides a simple, effective key-value storage system that persists data across browser sessions.
- **Future Native Implementation**: For better performance, querying capabilities, and reliability, this would be replaced with a native database solution like `SQLite` (via Room) or a fast key-value store like `MMKV`.

## Build & Deployment

This is a standard React web application.

1.  **Run Locally**: `npm install && npm run dev`
2.  **Build for Production**: `npm run build`

The app is ready to be deployed to any static web hosting service (Vercel, Netlify, GitHub Pages). As a Progressive Web App (PWA), it can be "installed" on a device's home screen for a more app-like experience.
