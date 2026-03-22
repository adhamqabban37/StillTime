import React from "react";
import ReactDOM from "react-dom/client";
import "./src/index.css";
import App from "./App.tsx";
import { AppProvider } from "./context/AppContext.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AppProvider>
          <App />
        </AppProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error("Failed to initialize app:", error);
  // Fallback: show error message directly in DOM
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1>App Initialization Error</h1>
        <p>Failed to start the application. Please try clearing app data and restarting.</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${
          error instanceof Error ? error.message : String(error)
        }</pre>
      </div>
    `;
  }
}
