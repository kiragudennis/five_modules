// /app/hooks/useSupabaseRealtime.ts
"use client";

import { useEffect } from "react";

type RealtimeTableConfig = {
  table: string;
  filter?: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
};

type UseSupabaseRealtimeOptions = {
  supabase: any;
  channelName: string;
  tables: RealtimeTableConfig[];
  onEvent: () => void;
  enabled?: boolean;
};

export function useSupabaseRealtime({
  supabase,
  channelName,
  tables,
  onEvent,
  enabled = true,
}: UseSupabaseRealtimeOptions) {
  useEffect(() => {
    if (!enabled || !supabase || tables.length === 0) return;

    const channel = supabase.channel(channelName);

    for (const tableConfig of tables) {
      channel.on(
        "postgres_changes",
        {
          event: tableConfig.event || "*",
          schema: "public",
          table: tableConfig.table,
          ...(tableConfig.filter ? { filter: tableConfig.filter } : {}),
        },
        () => {
          onEvent();
        },
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, channelName, enabled, onEvent, tables]);
}
