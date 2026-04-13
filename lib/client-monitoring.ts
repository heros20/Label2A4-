export function reportClientError(
  source: string,
  error: unknown,
  context?: Record<string, unknown>,
) {
  if (typeof window === "undefined") {
    return
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Erreur inconnue"

  void fetch("/api/client-errors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source,
      message,
      context,
    }),
  }).catch(() => {
    // Keep the UI responsive even if client error reporting fails.
  })
}
