// src/sentry.js
// GrowthPILOT — Sentry frontend initialization

import * as Sentry from "@sentry/react";

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "production",
    tracesSampleRate: 0.2,
    // Ne pas capturer les erreurs réseau banales
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      "Load failed",
      "NetworkError",
      "Failed to fetch",
    ],
    beforeSend(event) {
      // Ne pas envoyer les erreurs des guests (token = "guest")
      const token = localStorage.getItem("token");
      if (!token || token === "guest") return null;
      return event;
    },
  });
};

export { Sentry };
