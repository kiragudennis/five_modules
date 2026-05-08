"use client";

import { useEffect, useRef } from "react";

type PollingOptions = {
  enabled?: boolean;
  intervalMs?: number;
  runImmediately?: boolean;
};

export function usePolling(
  callback: () => void | Promise<void>,
  options: PollingOptions = {},
) {
  const { enabled = true, intervalMs = 2500, runImmediately = true } = options;
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const execute = async () => {
      try {
        await callbackRef.current();
      } catch (error) {
        if (mounted) {
          console.error("Polling callback failed:", error);
        }
      }
    };

    if (runImmediately) {
      void execute();
    }

    const timer = setInterval(() => {
      void execute();
    }, intervalMs);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [enabled, intervalMs, runImmediately]);
}
