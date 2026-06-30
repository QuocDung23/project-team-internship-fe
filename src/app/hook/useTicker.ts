// Global clock so multiple components stay in sync and time-ago labels
// recompute on a single interval instead of one per row.

import { useEffect, useState } from "react";

export function useTicker(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

// Re-export formatters so callers can `import { useTicker, formatTime } from
// ".../hook/useTicker"` without an extra import line. The canonical home is
// utils/formatters.ts.
export { formatAgo, formatTime, formatDateTime } from "../utils/formatters";