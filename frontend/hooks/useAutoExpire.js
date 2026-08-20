import { useEffect } from "react";

// =====================================================
// useAutoExpire
// =====================================================
//
// Safety net for tabs that stay open a long time. The backend
// already excludes anything older than 24h on every fetch, but
// if a page has been open without a refetch, real-time-pushed
// items would still visually linger past the 24h mark. This
// hook periodically re-checks the currently-rendered list and
// prunes anything that has crossed the 24h boundary — purely
// client-side, does NOT touch the database.
// =====================================================

export function useAutoExpire(items, setItems, getTimestamp, windowHours = 24, checkIntervalMs = 60000) {
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - windowHours * 60 * 60 * 1000;

      setItems((previous) =>
        previous.filter((item) => {
          const ts = getTimestamp(item);
          if (!ts) return true;

          const time = new Date(ts).getTime();
          if (Number.isNaN(time)) return true;

          return time >= cutoff;
        })
      );
    }, checkIntervalMs);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setItems, getTimestamp, windowHours, checkIntervalMs]);
}