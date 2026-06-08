type ErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  console.error("[App Error]", error, {
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
    ...context,
  });
}
