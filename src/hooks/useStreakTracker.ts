// hooks/useStreakTracker.ts
"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/context/AuthContext";

const STREAK_CHECKED_KEY = "streak_checked_date";
const SESSION_START_KEY = "session_start_time";
const LAST_HEARTBEAT_KEY = "last_heartbeat_time";
const TOTAL_SITE_SECONDS_KEY = "total_site_seconds";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/([.$?*|{}()\[\]\\\/+^])/g, "\\$1")}=([^;]*)`,
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 864e5);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function getStorageNumber(key: string): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(key) || "0", 10) || 0;
}

function setStorageNumber(key: string, value: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value.toString());
}

export function useStreakTracker() {
  const { supabase, profile } = useAuth();
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const streakInterval = useRef<NodeJS.Timeout | null>(null);
  const sessionStart = useRef<number>(Date.now());
  const lastHeartbeat = useRef<number>(Date.now());
  const isMounted = useRef(true);
  const hasCheckedToday = useRef(false);

  // Send heartbeat to server - STABLE reference
  const sendHeartbeat = useCallback(async () => {
    if (!profile?.id || !supabase || !isMounted.current) return;

    const now = Date.now();
    const durationSinceLastHeartbeat = Math.floor(
      (now - lastHeartbeat.current) / 1000,
    );
    if (durationSinceLastHeartbeat < 30) return;

    try {
      const sessionSeconds = Math.floor((now - sessionStart.current) / 1000);

      await supabase.rpc("update_user_activity", {
        p_user_id: profile.id,
        p_duration_seconds: durationSinceLastHeartbeat,
        p_session_seconds: sessionSeconds,
      });

      lastHeartbeat.current = now;

      const currentTotal = getStorageNumber(TOTAL_SITE_SECONDS_KEY);
      setStorageNumber(
        TOTAL_SITE_SECONDS_KEY,
        currentTotal + durationSinceLastHeartbeat,
      );
      localStorage.setItem(LAST_HEARTBEAT_KEY, now.toString());
    } catch (error) {
      console.error("Heartbeat error:", error);
    }
  }, [profile?.id, supabase]); // Dependencies are stable

  // Check and update streaks - STABLE reference
  const checkStreakChallenges = useCallback(async () => {
    if (!profile?.id || !supabase || !isMounted.current) return;

    // Prevent multiple checks on same day
    const today = new Date().toDateString();
    if (hasCheckedToday.current) return;

    const lastChecked = getCookie(STREAK_CHECKED_KEY);
    if (lastChecked === today) return;

    hasCheckedToday.current = true;
    setCookie(STREAK_CHECKED_KEY, today, 1);

    try {
      const { data, error } = await supabase.rpc("check_and_update_streak", {
        p_user_id: profile.id,
      });

      if (error) {
        console.error("Streak check error:", error);
        hasCheckedToday.current = false; // Reset on error
        return;
      }

      if (data?.results?.length > 0) {
        console.log("Streaks updated:", data.results);
      }
    } catch (error) {
      console.error("Streak check error:", error);
      hasCheckedToday.current = false;
    }
  }, [profile?.id, supabase]); // Dependencies are stable

  // Initialize tracking - runs only once
  useEffect(() => {
    if (!profile?.id) return;

    isMounted.current = true;

    // Restore or set session start
    const savedStart = localStorage.getItem(SESSION_START_KEY);
    if (savedStart) {
      sessionStart.current = parseInt(savedStart, 10);
    } else {
      sessionStart.current = Date.now();
      localStorage.setItem(SESSION_START_KEY, sessionStart.current.toString());
    }

    lastHeartbeat.current = Date.now();
    hasCheckedToday.current = false;

    // Send heartbeat every 60 seconds
    heartbeatInterval.current = setInterval(() => {
      sendHeartbeat();
    }, 60000);

    // Check streaks on mount and every 30 minutes (but only once per day)
    checkStreakChallenges();
    streakInterval.current = setInterval(() => {
      // Reset daily check flag to allow re-check on new day
      const lastChecked = getCookie(STREAK_CHECKED_KEY);
      const today = new Date().toDateString();
      if (lastChecked !== today) {
        hasCheckedToday.current = false;
        checkStreakChallenges();
      }
    }, 1800000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendHeartbeat();
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }
      } else {
        lastHeartbeat.current = Date.now();
        if (!heartbeatInterval.current) {
          heartbeatInterval.current = setInterval(() => {
            sendHeartbeat();
          }, 60000);
        }
        // Check streak on visibility change, but only if not checked today
        const lastChecked = getCookie(STREAK_CHECKED_KEY);
        const today = new Date().toDateString();
        if (lastChecked !== today) {
          hasCheckedToday.current = false;
          checkStreakChallenges();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      isMounted.current = false;

      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
      if (streakInterval.current) {
        clearInterval(streakInterval.current);
        streakInterval.current = null;
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Final heartbeat on unmount
      if (profile?.id && supabase) {
        const sessionDuration = Math.floor(
          (Date.now() - sessionStart.current) / 1000,
        );
        supabase
          .rpc("update_user_activity", {
            p_user_id: profile.id,
            p_duration_seconds: 0,
            p_session_seconds: sessionDuration,
          })
          .then(() => {
            const currentTotal = getStorageNumber(TOTAL_SITE_SECONDS_KEY);
            setStorageNumber(
              TOTAL_SITE_SECONDS_KEY,
              currentTotal + sessionDuration,
            );
          });
      }
    };
  }, [profile?.id, sendHeartbeat, checkStreakChallenges, supabase]); // Dependencies are stable now

  return { checkStreakChallenges, sendHeartbeat };
}
