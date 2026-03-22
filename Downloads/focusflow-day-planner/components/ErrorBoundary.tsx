import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
          <h1>Something went wrong</h1>
          <p>
            The app encountered an error. Please try clearing app data and
            restarting.
          </p>
          <details
            style={{
              whiteSpace: "pre-wrap",
              background: "#f5f5f5",
              padding: "10px",
              borderRadius: "4px",
              marginTop: "10px",
            }}
          >
            <summary>Error details</summary>
            {this.state.error?.toString()}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
