// src/hooks/useLiveBroadcast.ts
// Pure Supabase Realtime - No WebSocket server needed

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseLiveBroadcastOptions {
  channels: string[];
  onMessage?: (msg: any) => void;
  onWinner?: (data: any) => void;
  onTicker?: (data: any) => void;
  onStockUpdate?: (data: any) => void;
}

export function useLiveBroadcast({
  channels,
  onMessage,
  onWinner,
  onTicker,
  onStockUpdate,
}: UseLiveBroadcastOptions) {
  const { supabase } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  
  // Use refs to avoid re-renders
  const isConnectedRef = useRef(false);
  const activeChannelRef = useRef<RealtimeChannel | null>(null);
  
  // Store callbacks in refs to prevent unnecessary re-subscriptions
  const callbacksRef = useRef({ onMessage, onWinner, onTicker, onStockUpdate });
  callbacksRef.current = { onMessage, onWinner, onTicker, onStockUpdate };
  
  // Create a stable channels key for comparison
  const channelsKey = channels.sort().join(',');

  useEffect(() => {
    if (!supabase) return;
    
    let isMounted = true;

    // Create a single channel for all live events
    const channel = supabase.channel('live-broadcast', {
      config: {
        broadcast: { self: true },
        presence: { key: 'user-status' },
      },
    });
    
    // Store channel in ref immediately
    activeChannelRef.current = channel;

    // Get current callbacks from ref
    const currentCallbacks = callbacksRef.current;

    // Subscribe to table changes across all modules
    channel
      // Bundle purchases
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bundle_purchases' },
        (payload) => {
          const data = {
            type: 'ticker',
            channel: `bundle:${payload.new.bundle_id}`,
            data: {
              type: 'claim',
              userName: payload.new.user_name || 'Customer',
              itemName: payload.new.bundle_name,
              timestamp: new Date().toISOString(),
            },
          };
          currentCallbacks.onTicker?.(data.data);
          currentCallbacks.onMessage?.(data);
        }
      )
      // Spin attempts (wins)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'spin_attempts' },
        (payload) => {
          const newRecord = payload.new;
          if (newRecord.points_awarded > 0 || newRecord.prize_value) {
            const data = {
              type: 'ticker',
              channel: `spin:${newRecord.game_id}`,
              data: {
                type: 'win',
                userName: newRecord.user_name || 'Anonymous',
                prizeText: newRecord.prize_value,
                pointsAwarded: newRecord.points_awarded,
                timestamp: new Date().toISOString(),
              },
            };
            currentCallbacks.onTicker?.(data.data);
            currentCallbacks.onMessage?.(data);
          }
        }
      )
      // Spin games (grand prize wins)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'spin_games' },
        (payload) => {
          const oldRecord = payload.old;
          const newRecord = payload.new;
          if (newRecord.single_prize_claimed && !oldRecord.single_prize_claimed) {
            const data = {
              type: 'winner',
              channel: `spin:${newRecord.id}`,
              data: {
                type: 'grand_prize_won',
                winnerName: newRecord.single_prize_winner_name || 'Anonymous',
                prize: 'Grand Prize',
                timestamp: new Date().toISOString(),
              },
            };
            currentCallbacks.onWinner?.(data.data);
            currentCallbacks.onMessage?.(data);
          }
        }
      )
      // Challenge actions
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'challenge_actions' },
        (payload) => {
          const data = {
            type: 'ticker',
            channel: `challenge:${payload.new.challenge_id}`,
            data: {
              type: 'action',
              userName: payload.new.user_name,
              actionText: payload.new.action_text,
              pointsAwarded: payload.new.points_awarded,
              timestamp: new Date().toISOString(),
            },
          };
          currentCallbacks.onTicker?.(data.data);
          currentCallbacks.onMessage?.(data);
        }
      )
      // Draw entries
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'draw_entries' },
        (payload) => {
          const data = {
            type: 'ticker',
            channel: `draw:${payload.new.draw_id}`,
            data: {
              type: 'entry',
              userName: payload.new.user_name,
              entryCount: payload.new.entry_count,
              timestamp: new Date().toISOString(),
            },
          };
          currentCallbacks.onTicker?.(data.data);
          currentCallbacks.onMessage?.(data);
        }
      )
      // Deal claims
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deal_claims' },
        (payload) => {
          const data = {
            type: 'ticker',
            channel: `deal:${payload.new.deal_id}`,
            data: {
              type: 'claim',
              userName: payload.new.user_name,
              quantity: payload.new.quantity,
              timestamp: new Date().toISOString(),
            },
          };
          currentCallbacks.onTicker?.(data.data);
          currentCallbacks.onMessage?.(data);
        }
      )
      // Broadcast channel for announcements
      .on('broadcast', { event: 'announcement' }, ({ payload }) => {
        currentCallbacks.onMessage?.({
          type: 'announcement',
          data: payload,
        });
      })
      // Presence tracking for active users
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeCount = Object.keys(state).length;
        currentCallbacks.onMessage?.({
          type: 'presence',
          data: { activeCount, state },
        });
      });

    // Subscribe to the channel
    channel.subscribe(async (status) => {
      if (!isMounted) return;
      
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        isConnectedRef.current = true;
        console.log('✅ Live broadcast channel connected');
        
        // Track user presence
        if (typeof channel.presenceState === 'function') {
          await channel.track({
            user_id: 'anonymous',
            online_at: new Date().toISOString(),
          });
        }
      } else if (status === 'CHANNEL_ERROR') {
        setIsConnected(false);
        isConnectedRef.current = false;
        console.error('Channel error');
      }
    });

    // Cleanup - NO state updates here!
    return () => {
      isMounted = false;
      if (activeChannelRef.current) {
        activeChannelRef.current.unsubscribe();
        activeChannelRef.current = null;
      }
      isConnectedRef.current = false;
      // Don't call setIsConnected(false) here!
    };
  }, [supabase, channelsKey]);

  const sendAnnouncement = useCallback(
    async (message: string, sender?: string) => {
      const channel = activeChannelRef.current;
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
    },
    [] // No dependencies needed since we use ref
  );

  return {
    isConnected,
    sendAnnouncement,
  };
}