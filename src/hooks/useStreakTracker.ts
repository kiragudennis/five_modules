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

  // Send heartbeat to server (lightweight - only stores session time)
  const sendHeartbeat = useCallback(async () => {
    if (!profile?.id || !supabase) return;

    const now = Date.now();
    const durationSinceLastHeartbeat = Math.floor(
      (now - lastHeartbeat.current) / 1000,
    );
    if (durationSinceLastHeartbeat < 30) return;

    try {
      const sessionSeconds = Math.floor((now - sessionStart.current) / 1000);

      // Use RPC instead of supabase.sql
      await supabase.rpc("update_user_activity", {
        p_user_id: profile.id,
        p_duration_seconds: durationSinceLastHeartbeat,
        p_session_seconds: sessionSeconds,
      });

      lastHeartbeat.current = now;

      // Also track in localStorage as backup
      const currentTotal = getStorageNumber(TOTAL_SITE_SECONDS_KEY);
      setStorageNumber(
        TOTAL_SITE_SECONDS_KEY,
        currentTotal + durationSinceLastHeartbeat,
      );
      localStorage.setItem(LAST_HEARTBEAT_KEY, now.toString());
    } catch (error) {
      console.error("Heartbeat error:", error);
    }
  }, [profile?.id, supabase]);

  // Check and update streaks via RPC
  const checkStreakChallenges = useCallback(async () => {
    if (!profile?.id || !supabase) return;

    const today = new Date().toDateString();
    const lastChecked = getCookie(STREAK_CHECKED_KEY);

    // Only check once per day
    if (lastChecked === today) return;
    setCookie(STREAK_CHECKED_KEY, today, 1);

    try {
      const { data, error } = await supabase.rpc("check_and_update_streak", {
        p_user_id: profile.id,
      });

      if (error) {
        console.error("Streak check error:", error);
        return;
      }

      if (data?.results?.length > 0) {
        console.log("Streaks updated:", data.results);
      }
    } catch (error) {
      console.error("Streak check error:", error);
    }
  }, [profile?.id, supabase]);

  // Initialize tracking
  useEffect(() => {
    if (!profile?.id) return;

    // Restore or set session start
    const savedStart = localStorage.getItem(SESSION_START_KEY);
    if (savedStart) {
      sessionStart.current = parseInt(savedStart, 10);
    } else {
      sessionStart.current = Date.now();
      localStorage.setItem(SESSION_START_KEY, sessionStart.current.toString());
    }

    lastHeartbeat.current = Date.now();

    // Send heartbeat every 60 seconds
    heartbeatInterval.current = setInterval(sendHeartbeat, 60000);

    // Check streaks on mount and every 30 minutes
    checkStreakChallenges();
    streakInterval.current = setInterval(() => {
      setCookie(STREAK_CHECKED_KEY, "", -1); // Clear to allow re-check
      checkStreakChallenges();
    }, 1800000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendHeartbeat();
        if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      } else {
        lastHeartbeat.current = Date.now();
        heartbeatInterval.current = setInterval(sendHeartbeat, 60000);
        setCookie(STREAK_CHECKED_KEY, "", -1);
        checkStreakChallenges();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      try {
        // Save session end
        const sessionDuration = Math.floor(
          (Date.now() - sessionStart.current) / 1000,
        );
        if (profile?.id && supabase) {
          supabase
            .rpc("update_user_activity", {
              p_user_id: profile.id,
              p_duration_seconds: 0,
              p_session_seconds: sessionDuration,
            })
            .throwOnError();
        }

        // Store session duration locally
        const currentTotal = getStorageNumber(TOTAL_SITE_SECONDS_KEY);
        setStorageNumber(
          TOTAL_SITE_SECONDS_KEY,
          currentTotal + sessionDuration,
        );

        if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
        if (streakInterval.current) clearInterval(streakInterval.current);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      } catch (error) {
        console.log("Error updating user activity:", error);
      }
    };
  }, [profile?.id, sendHeartbeat, checkStreakChallenges, supabase]);

  return { checkStreakChallenges, sendHeartbeat };
}
