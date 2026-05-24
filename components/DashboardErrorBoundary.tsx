"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class DashboardErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[Dashboard error]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#faf8f3] p-8">
          <div className="max-w-2xl mx-auto bg-white border border-red-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-red-700 mb-4">
              Coś się popsuło na dashboardzie
            </h2>
            <p className="text-sm text-neutral-700 mb-4">
              {this.state.error.message}
            </p>
            <pre className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-3 whitespace-pre-wrap overflow-auto max-h-80">
              {this.state.error.stack}
            </pre>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => this.setState({ error: null })}
                className="px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium"
              >
                Spróbuj ponownie
              </button>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("zwr-app-state-v1");
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-900 text-sm font-medium"
              >
                Zresetuj stan i przeładuj
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
