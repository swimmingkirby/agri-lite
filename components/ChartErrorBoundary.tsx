"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ChartErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Chart render failed:", error);
    }
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-700">Could not render chart.</p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-3 rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
