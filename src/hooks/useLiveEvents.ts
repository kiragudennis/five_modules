// src/hooks/useLiveEvents.ts
// Direct Supabase Realtime - No WebSocket server needed!
// Websocket replacement for live events across all modules (Spin, Challenge, Draw, Bundle, Deal)
// Listens to relevant database changes and broadcasts them to connected clients in real-time.
// Handles presence tracking for viewer counts and allows admin announcements via broadcast messages.

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseLiveEventsOptions {
  moduleType: 'spin' | 'challenge' | 'draw' | 'bundle' | 'deal';
  moduleId: string;
  onWinner?: (data: any) => void;
  onTicker?: (data: any) => void;
  onActivity?: (data: any) => void;
}

export function useLiveEvents({ 
  moduleType, 
  moduleId, 
  onWinner, 
  onTicker, 
  onActivity 
}: UseLiveEventsOptions) {
  const { supabase } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!supabase || !moduleId) return;

    // Create a single channel for this module
    const liveChannel = supabase.channel(`live-${moduleType}-${moduleId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: 'viewer' },
      },
    });

    // Subscribe to database changes based on module type
    if (moduleType === 'spin') {
      liveChannel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'spin_attempts',
            filter: `game_id=eq.${moduleId}`,
          },
          (payload) => {
            const record = payload.new;
            if (record.points_awarded > 0 || record.prize_value) {
              onTicker?.({
                type: 'win',
                userName: record.user_name || 'Someone',
                prize: record.prize_value || `${record.points_awarded} points`,
                timestamp: record.created_at,
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'spin_games',
            filter: `id=eq.${moduleId}`,
          },
          (payload) => {
            if (payload.new.single_prize_claimed && !payload.old.single_prize_claimed) {
              onWinner?.({
                type: 'grand_prize',
                winnerName: payload.new.single_prize_winner_name,
                timestamp: new Date().toISOString(),
              });
            }
          }
        );
    }

    if (moduleType === 'bundle') {
      liveChannel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bundle_purchases',
          filter: `bundle_id=eq.${moduleId}`,
        },
        (payload) => {
          onTicker?.({
            type: 'claim',
            userName: payload.new.user_name,
            itemName: payload.new.bundle_name,
            timestamp: payload.new.created_at,
          });
        }
      );
    }

    if (moduleType === 'challenge') {
      liveChannel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenge_actions',
          filter: `challenge_id=eq.${moduleId}`,
        },
        (payload) => {
          onActivity?.({
            userName: payload.new.user_name,
            action: payload.new.action_text,
            points: payload.new.points_awarded,
            timestamp: payload.new.created_at,
          });
        }
      );
    }

    if (moduleType === 'draw') {
      liveChannel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'draw_entries',
          filter: `draw_id=eq.${moduleId}`,
        },
        (payload) => {
          onTicker?.({
            type: 'entry',
            userName: payload.new.user_name,
            entries: payload.new.entry_count,
            timestamp: payload.new.created_at,
          });
        }
      );
    }

    if (moduleType === 'deal') {
      liveChannel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deal_claims',
          filter: `deal_id=eq.${moduleId}`,
        },
        (payload) => {
          onTicker?.({
            type: 'claim',
            userName: payload.new.user_name,
            quantity: payload.new.quantity,
            timestamp: payload.new.claimed_at,
          });
        }
      );
    }

    // Presence tracking for viewer count
    // Presence handling uses runtime methods not perfectly reflected in types — using any to satisfy TS
    (liveChannel as any).on('presence', { event: 'sync', timeout: 5000 }, () => {
      const state = (liveChannel as any).presenceState();
      setViewerCount(Object.keys(state).length);
    });

    // Broadcast channel for admin announcements
    liveChannel.on('broadcast', { event: 'announcement' }, ({ payload }) => {
      onTicker?.({
        type: 'announcement',
        message: payload.message,
        sender: payload.sender,
        timestamp: new Date().toISOString(),
      });
    });

    // Subscribe and track presence
    liveChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        console.log(`✅ Connected to ${moduleType}:${moduleId}`);
        
        // Track this viewer
        await liveChannel.track({
          user_id: 'viewer',
          online_at: new Date().toISOString(),
        });
      } else if (status === 'CHANNEL_ERROR') {
        setIsConnected(false);
        console.error('Channel error');
      }
    });

    setChannel(liveChannel);

    return () => {
      liveChannel.unsubscribe();
    };
  }, [supabase, moduleType, moduleId, onWinner, onTicker, onActivity]);

  const sendAnnouncement = useCallback(async (message: string, sender?: string) => {
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'announcement',
        payload: {
          message,
          sender: sender || 'Admin',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, [channel]);

  return {
    isConnected,
    viewerCount,
    sendAnnouncement,
  };
}