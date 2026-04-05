"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
          style={{ color: "var(--text)" }}
        >
          <div className="text-5xl mb-4">😵</div>
          <h2 className="text-xl font-bold mb-2">Algo salió mal</h2>
          <p
            className="text-sm mb-6 max-w-xs"
            style={{ color: "var(--text-muted)" }}
          >
            Ocurrió un error inesperado. Puedes intentar de nuevo o volver al
            inicio.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre
              className="text-[0.65rem] text-left mb-4 p-3 rounded-lg overflow-auto max-w-full max-h-32"
              style={{
                background: "var(--bg-elevated)",
                color: "#FF453A",
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="btn btn-primary px-6 py-2.5 font-bold"
            >
              Reintentar
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="btn btn-ghost px-6 py-2.5"
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
